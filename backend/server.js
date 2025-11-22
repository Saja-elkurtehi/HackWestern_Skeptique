const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const localStories = require("./data/stories.json");

dotenv.config();

const app = express();
const PORT = 3000;

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(cors());
app.use(express.json());

/* -------------------------------------------------------
   1) Fetch articles from NewsAPI
------------------------------------------------------- */
async function fetchArticlesForTopic(topic) {
  if (!NEWS_API_KEY) return null;

  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: topic,
        language: "en",
        sortBy: "relevancy",
        pageSize: 6,
        apiKey: NEWS_API_KEY,
      },
    });

    const articles = res.data.articles || [];

    return articles.map((a, i) => ({
      id: `newsapi-${i}`,
      name: a.source?.name || "Unknown",
      title: a.title || "Untitled",
      summary:
        a.description || a.content || "No summary available.",
      tone: "Unknown",
      frame: "Unknown",
      emoji: "📰",
      url: a.url,
      imageUrl: a.urlToImage || null,
    }));
  } catch (err) {
    console.error("NewsAPI Error:", err.message);
    return null;
  }
}
/* -------------------------------------------------------
   2) Call Gemini via OpenRouter
------------------------------------------------------- */
async function callGemini(prompt) {
  if (!OPENROUTER_API_KEY) {
    console.warn("Missing OPENROUTER_API_KEY");
    return null;
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // Use a valid Gemini model on OpenRouter
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Skeptiq",
        },
      }
    );

    const msg = response.data.choices?.[0]?.message?.content;
    if (!msg) {
      console.error("Gemini returned no message content:", response.data);
      return null;
    }

    // OpenRouter can sometimes return content as a string or array of parts
    if (typeof msg === "string") return msg.trim();
    if (Array.isArray(msg)) {
      return msg.map((part) => part.text || "").join(" ").trim();
    }

    return String(msg).trim();
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    return null;
  }
}

/* -------------------------------------------------------
   3) Generate Combined Summary + Blind Spots
------------------------------------------------------- */
async function generateSummaryAndBlindSpots(topic, sources) {
  const articlesText = sources
    .map(
      (s, i) =>
        `Article ${i + 1}:\nSource: ${s.name}\nTitle: ${
          s.title
        }\nSummary: ${s.summary}`
    )
    .join("\n\n");

  const prompt = `
Analyze the following articles about "${topic}".

${articlesText}

Return ONLY this JSON format:

{
  "combinedSummary": "string",
  "blindSpots": ["string1","string2","string3"]
}
`;

  let result = await callGemini(prompt);
  if (!result) return null;

  // Strip code fences if the model wraps JSON
  result = result.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(result);
    if (!parsed.combinedSummary || !Array.isArray(parsed.blindSpots)) {
      console.error("Gemini JSON shape unexpected:", parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("Gemini JSON Parse Error:", result);
    return null;
  }
}

/* -------------------------------------------------------
   4) Tone & Frame Classification
------------------------------------------------------- */
async function annotateSourcesWithToneAndFrame(topic, sources) {
  const articlesText = sources
    .map(
      (s) =>
        `ID: ${s.id}\nSource: ${s.name}\nTitle: ${s.title}\nSummary: ${s.summary}`
    )
    .join("\n\n");

  const prompt = `
Label each article about "${topic}" with a tone and frame.

Tone options: "Alarmist","Neutral","Optimistic","Skeptical","Analytical"
Frame options: "Security","Humanitarian","Economic","Political","Diplomatic","Other"

Return ONLY JSON like:

[
  {"id":"newsapi-0","tone":"Neutral","frame":"Diplomatic"},
  {"id":"newsapi-1","tone":"Alarmist","frame":"Security"}
]

Articles:
${articlesText}
`;

  let result = await callGemini(prompt);
  if (!result) return sources;

  result = result.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(result);
    if (!Array.isArray(parsed)) {
      console.error("Tone/frame JSON not array:", parsed);
      return sources;
    }

    const map = new Map(parsed.map((p) => [p.id, p]));

    return sources.map((s) => ({
      ...s,
      tone: map.get(s.id)?.tone || "Unknown",
      frame: map.get(s.id)?.frame || "Unknown",
    }));
  } catch (err) {
    console.error("Tone/frame parse error:", result);
    return sources;
  }
}


/* -------------------------------------------------------
   Endpoints
------------------------------------------------------- */
app.get("/", (req, res) => res.json({ message: "Skeptiq backend running" }));

app.get("/stories", (req, res) => {
  res.json(
    Object.values(localStories).map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags,
      sources: s.sourcesCount,
      lastUpdated: s.lastUpdated,
    }))
  );
});

app.get("/stories/:id", async (req, res) => {
  const localStory = localStories[req.params.id];
  if (!localStory) return res.status(404).json({ error: "Story not found" });

  const topic = localStory.title;

  // 1) Fetch NewsAPI
  let liveArticles = await fetchArticlesForTopic(topic);
  if (!liveArticles) return res.json(localStory);

  // 2) Tone + frame
  liveArticles = await annotateSourcesWithToneAndFrame(topic, liveArticles);

  // 3) Summary + blind spots
  const ai = await generateSummaryAndBlindSpots(topic, liveArticles);

  const storyResponse = {
    ...localStory,
    sourcesCount: liveArticles.length,
    sources: liveArticles,
    lastUpdated: "Just now",
    combinedSummary: { content: ai?.combinedSummary || "Not available" },
    blindSpots: { items: ai?.blindSpots || [] },
  };

  res.json(storyResponse);
});

app.listen(PORT, () =>
  console.log(`Skeptiq running at http://localhost:${PORT}`)
);
