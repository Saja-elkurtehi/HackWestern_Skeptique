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
   Helper: call Gemini via OpenRouter
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

    let msg = response.data.choices?.[0]?.message?.content;
    if (!msg) return null;

    if (typeof msg === "string") return msg.trim();
    if (Array.isArray(msg)) {
      return msg.map((p) => p.text || "").join(" ").trim();
    }

    return String(msg).trim();
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    return null;
  }
}

/* -------------------------------------------------------
   1) Fetch full articles for StoryView (per topic)
------------------------------------------------------- */
async function fetchArticlesForTopic(topic) {
  if (!NEWS_API_KEY) return null;

  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: topic,
        language: "en",
        sortBy: "relevancy",
        pageSize: 8,
        apiKey: NEWS_API_KEY,
      },
    });

    const articles = res.data.articles || [];

    return articles.map((a, i) => ({
      id: `newsapi-${i}`,
      name: a.source?.name || "Unknown",
      title: a.title || "Untitled",
      summary: a.description || a.content || "No summary available.",
      tone: "Unknown",
      frame: "Unknown",
      url: a.url,
      imageUrl: a.urlToImage || null,
    }));
  } catch (err) {
    console.error("NewsAPI Error:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   2) Tone + Frame classification for StoryView
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

Tone: "Alarmist", "Neutral", "Optimistic", "Skeptical", "Analytical"
Frame: "Security","Humanitarian","Economic","Political","Diplomatic","Other"

Return ONLY JSON:

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
    const map = new Map(parsed.map((p) => [p.id, p]));

    return sources.map((s) => ({
      ...s,
      tone: map.get(s.id)?.tone || "Unknown",
      frame: map.get(s.id)?.frame || "Unknown",
    }));
  } catch {
    return sources;
  }
}

/* -------------------------------------------------------
   3) Combined summary + blind spots for StoryView
------------------------------------------------------- */
async function generateSummaryAndBlindSpots(topic, sources) {
  const articlesText = sources
    .map(
      (s, i) =>
        `Article ${i + 1}:\nSource: ${s.name}\nTitle: ${s.title}\nSummary: ${s.summary}`
    )
    .join("\n\n");

  const prompt = `
Analyze the articles for "${topic}" and return ONLY JSON:

{
  "combinedSummary": "string",
  "blindSpots": ["string1","string2","string3"]
}

Articles:
${articlesText}
`;

  let result = await callGemini(prompt);
  if (!result) return null;

  result = result.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------
   4) Generate UMBRELLA topics for Landing from localStories
------------------------------------------------------- */
async function generateUmbrellaTopicsFromLocalStories() {
  const storiesArray = Object.values(localStories);

  const listText = storiesArray
    .map((s) => `ID: ${s.id}, title: "${s.title}"`)
    .join("\n");

  const prompt = `
You are helping a media-bias comparison app.

For each of these specific news stories, create:
- A broader umbrella topic (2–4 words ONLY)
- 2–3 short tags

The umbrella should be higher-level than the story.
Examples:
- "Gaza ceasefire talks" → "Middle East conflict"
- "AI regulation debate" → "Global AI governance"
- "Election polling shifts" → "Election dynamics"

Return ONLY JSON array like:

[
  {"id": 1, "title": "Middle East conflict", "tags": ["Politics","Conflict","Region"]},
  {"id": 2, "title": "Global AI governance", "tags": ["Technology","Policy"]},
  {"id": 3, "title": "Climate policy", "tags": ["Environment","Policy"]},
  {"id": 4, "title": "Election dynamics", "tags": ["Politics","Elections"]}
]

Stories:
${listText}
`;

  let result = await callGemini(prompt);
  if (!result) return null;

  result = result.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(result);
    if (!Array.isArray(parsed)) {
      console.error("Umbrella topics JSON is not an array:", parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("Umbrella topics JSON parse error:", result);
    return null;
  }
}

/* -------------------------------------------------------
   Root - sanity check
------------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({ message: "Skeptiq backend running" });
});

/* -------------------------------------------------------
   LANDING PAGE: /stories → umbrella topics (2–4 words)
------------------------------------------------------- */
app.get("/stories", async (req, res) => {
  try {
    const storiesArray = Object.values(localStories);

    // 1) Generate umbrella topics from localStories titles (as before)
    const umbrellas = await generateUmbrellaTopicsFromLocalStories();

    // 2) For each story, fetch articles once to estimate lens count
    const lensCounts = await Promise.all(
      storiesArray.map(async (s) => {
        try {
          const articles = await fetchArticlesForTopic(s.title);
          return articles ? articles.length : 0;
        } catch (err) {
          console.error("Error counting lenses for", s.title, err.message);
          return 0;
        }
      })
    );

    // If Gemini failed, just use local titles
    const umbrellaMap = new Map(
      (umbrellas || []).map((u) => [String(u.id), u])
    );

    const response = storiesArray.map((s, index) => {
      const u = umbrellaMap.get(String(s.id));

      return {
        id: s.id,
        title: u?.title || s.title,                          // umbrella topic
        tags: Array.isArray(u?.tags) ? u.tags : s.tags,      // tags from Gemini or fallback
        sources: lensCounts[index] ?? s.sourcesCount ?? 0,   // REAL lens count
        lastUpdated: u ? "Live" : s.lastUpdated,
      };
    });

    res.json(response);
  } catch (err) {
    console.error("/stories umbrella error:", err.message);

    // Final safety fallback
    res.json(
      Object.values(localStories).map((s) => ({
        id: s.id,
        title: s.title,
        tags: s.tags,
        sources: s.sourcesCount,
        lastUpdated: s.lastUpdated,
      }))
    );
  }
});


/* -------------------------------------------------------
   STORYVIEW PAGE: /stories/:id  (unchanged behaviour)
------------------------------------------------------- */
app.get("/stories/:id", async (req, res) => {
  const localStory = localStories[req.params.id];
  if (!localStory) return res.status(404).json({ error: "Story not found" });

  const topic = localStory.title;

  // 1) Fetch full articles for this topic
  let liveArticles = await fetchArticlesForTopic(topic);
  if (!liveArticles) {
    // fallback: just return the localStory shape
    return res.json(localStory);
  }

  // 2) Add tone/frame labels
  liveArticles = await annotateSourcesWithToneAndFrame(topic, liveArticles);

  // 3) Generate combined summary + blind spots
  const ai = await generateSummaryAndBlindSpots(topic, liveArticles);

  return res.json({
    ...localStory,
    sourcesCount: liveArticles.length,
    sources: liveArticles,
    lastUpdated: "Just now",
    combinedSummary: {
      content: ai?.combinedSummary || "Not available",
    },
    blindSpots: {
      items: ai?.blindSpots || [],
    },
  });
});

/* -------------------------------------------------------
   START SERVER
------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Skeptiq backend running at http://localhost:${PORT}`);
});
