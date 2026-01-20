const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();
const PORT = 3000;

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(cors());
app.use(express.json());

const localStories = require("./data/stories.json");

/* -------------------------------------------------------
   CACHING
------------------------------------------------------- */
const STORY_TTL = 1000 * 60 * 30; // 30 min
const storyCache = new Map(); // hash -> { data, timestamp }

/* -------------------------------------------------------
   AI CALL (Gemini via OpenRouter)
------------------------------------------------------- */
async function callGemini(prompt, temperature = 0.2) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content: prompt }],
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Skeptique",
        },
      }
    );

    const msg = res.data.choices?.[0]?.message?.content;
    if (!msg) return null;

    return typeof msg === "string"
      ? msg.trim()
      : msg.map((p) => p.text).join(" ").trim();
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    return null;
  }
}

/* -------------------------------------------------------
   NEWS FETCH
------------------------------------------------------- */
async function fetchArticles(topic) {
  if (!NEWS_API_KEY) return [];

  const res = await axios.get("https://newsapi.org/v2/everything", {
    params: {
      q: topic,
      language: "en",
      sortBy: "relevancy",
      pageSize: 8,
      apiKey: NEWS_API_KEY,
    },
  });

  return (res.data.articles || []).map((a, i) => ({
    id: `newsapi-${i}`,
    source: a.source?.name || "Unknown",
    title: a.title || "Untitled",
    summary: a.description || a.content || "",
    url: a.url,
    imageUrl: a.urlToImage || null,
  }));
}

/* -------------------------------------------------------
   CHEAP HEURISTIC TONE + FRAME
------------------------------------------------------- */
function inferTone(summary) {
  const s = summary.toLowerCase();
  if (/(crisis|threat|danger|urgent|collapse)/.test(s)) return "Alarmist";
  if (/(breakthrough|progress|improve|success)/.test(s)) return "Optimistic";
  if (/(study|analysis|report|data)/.test(s)) return "Analytical";
  return "Neutral";
}

function inferFrame(summary) {
  const s = summary.toLowerCase();
  if (/(law|regulation|policy|government|election)/.test(s)) return "Political";
  if (/(economy|market|cost|industry|business)/.test(s)) return "Economic";
  if (/(health|civilian|rights|community)/.test(s)) return "Humanitarian";
  if (/(security|defense|cyber|attack)/.test(s)) return "Security";
  return "Other";
}

/* -------------------------------------------------------
   SEMANTIC HASH (for caching)
------------------------------------------------------- */
function articleHash(articles) {
  return crypto
    .createHash("sha1")
    .update(articles.map((a) => a.title + a.source).join("|"))
    .digest("hex");
}

/* -------------------------------------------------------
   SINGLE AI CALL: summary + blind spots + fallback tone/frame
------------------------------------------------------- */
  async function aiSynthesize(topic, articles) {
    const text = articles
      .map(
        (a, i) =>
          `Article ${i + 1} (${a.source}): ${a.title}\n${a.summary || "No summary"}`
      )
      .join("\n\n");

    const prompt = `
  You are a media analyst.

  Analyze reporting on "${topic}".

  Return STRICT JSON ONLY. No commentary. No markdown.

  Schema:
  {
    "summary": {
      "content": "2–4 neutral sentences",
      "oneSentence": "Exactly one sentence"
    },
    "blindSpots": ["item 1","item 2","item 3"],
    "labels": [
      {"id":"newsapi-0","tone":"Neutral","frame":"Political"}
    ]
  }

  Articles:
  ${text}
  `;

    const raw = await callGemini(prompt, 0.2);

    if (!raw) {
      console.warn("AI returned nothing");
      return null;
    }

    console.log("🧠 RAW AI OUTPUT:\n", raw);

    // 🔒 Defensive JSON extraction
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("No JSON object found in AI output");
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error("AI JSON parse failed:", err.message);
      return null;
    }
  }


/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */

app.get("/", (_, res) => {
  res.json({ message: "Skeptique backend running" });
});

/* LANDING — NO AI */
app.get("/stories", (_, res) => {
  res.json(
    Object.values(localStories).map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags,
      sources: s.sourcesCount ?? 0,
      lastUpdated: s.lastUpdated,
    }))
  );
});

/* STORY VIEW */
app.get("/stories/:id", async (req, res) => {
  const story = localStories[req.params.id];
  if (!story) return res.status(404).json({ error: "Not found" });

  const articles = await fetchArticles(story.title);
  if (!articles.length) return res.json(story);

  const hash = articleHash(articles);
  const cached = storyCache.get(hash);

  if (cached && Date.now() - cached.timestamp < STORY_TTL) {
    return res.json(cached.data);
  }

  // heuristic labels
  articles.forEach((a) => {
    a.tone = inferTone(a.summary);
    a.frame = inferFrame(a.summary);
  });

  const ai = await aiSynthesize(story.title, articles);

  // AI fallback refinement
  if (ai?.labels) {
    const map = new Map(ai.labels.map((l) => [l.id, l]));
    articles.forEach((a) => {
      if (map.has(a.id)) {
        a.tone = map.get(a.id).tone;
        a.frame = map.get(a.id).frame;
      }
    });
  }

  const result = {
    ...story,
    sourcesCount: articles.length,
    sources: articles,
    lastUpdated: "Just now",
    combinedSummary: {
      content: ai?.summary?.content || "Not available",
      oneSentence: ai?.summary?.oneSentence || null,
    },
    blindSpots: {
      items: ai?.blindSpots || [],
    },
  };

  storyCache.set(hash, {
    data: result,
    timestamp: Date.now(),
  });

  res.json(result);
});
/* -------------------------------------------------------
   SEARCH STORY — WITH AI SYNTHESIS
------------------------------------------------------- */
app.get("/search/story", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    // 1. Fetch articles
    const articles = await fetchArticles(q);

    if (!articles.length) {
      return res.status(404).json({ error: "No articles found" });
    }

    // 2. Hash for caching
    const hash = articleHash(articles);
    const cached = storyCache.get(hash);

    if (cached && Date.now() - cached.timestamp < STORY_TTL) {
      return res.json(cached.data);
    }

    // 3. Initial heuristic labels (fallback)
    articles.forEach((a) => {
      a.tone = inferTone(a.summary);
      a.frame = inferFrame(a.summary);
    });

    // 4. AI synthesis (summary + blind spots + per-article labels)
    const ai = await aiSynthesize(q, articles);

    if (ai?.labels) {
      const map = new Map(ai.labels.map((l) => [l.id, l]));
      articles.forEach((a) => {
        if (map.has(a.id)) {
          a.tone = map.get(a.id).tone;
          a.frame = map.get(a.id).frame;
        }
      });
    }

    // 5. Final response (MATCHES StoryView EXPECTATIONS)
    const result = {
      id: `search:${q}`,
      title: q,
      tags: ["Search"],
      sourcesCount: articles.length,
      sources: articles,
      lastUpdated: "Live",
      combinedSummary: {
        content:
          ai?.summary?.content ||
          "This topic was generated from a live search across multiple news outlets.",
        oneSentence: ai?.summary?.oneSentence || null,
      },
      blindSpots: {
        items: ai?.blindSpots || [],
      },
    };

    // 6. Cache it
    storyCache.set(hash, {
      data: result,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (err) {
    console.error("Search story AI error:", err.message);
    res.status(500).json({ error: "Search story failed" });
  }
});



/* -------------------------------------------------------
   START SERVER
------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Skeptique backend running at http://localhost:${PORT}`);
});
