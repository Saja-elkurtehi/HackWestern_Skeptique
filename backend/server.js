const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const localStories = require('./data/stories.json');

dotenv.config();

const app = express();
const PORT = 3000;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

app.use(cors());
app.use(express.json());

async function fetchArticlesForTopic(topic) {
  if (!NEWS_API_KEY) {
    console.warn("Missing NEWS_API_KEY — using local stories.json");
    return null;
  }

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: topic,
        language: "en",
        sortBy: "relevancy",
        pageSize: 6,
        apiKey: NEWS_API_KEY,
      },
    });

    const articles = response.data.articles || [];
    if (!articles.length) return [];

    return articles.map((article, index) => ({
      id: `newsapi-${index}`,
      name: article.source?.name || "Unknown",
      summary: article.description || article.content || "No summary available.",
      tone: "Unknown",
      frame: "Unknown",
      emoji: "📰",
      url: article.url,
      title: article.title
    }));
  } catch (err) {
    console.error("NewsAPI Error:", err.message);
    return null;
  }
}

// Get minimal topic list
app.get('/stories', (req, res) => {
  const list = Object.values(localStories).map((story) => ({
    id: story.id,
    title: story.title,
    tags: story.tags,
    sources: story.sourcesCount,
    lastUpdated: story.lastUpdated
  }));
  res.json(list);
});

// Get full story (uses live NewsAPI)
app.get('/stories/:id', async (req, res) => {
  const { id } = req.params;
  const localStory = localStories[id];

  if (!localStory) return res.status(404).json({ error: "Story not found" });

  const topic = localStory.title;
  const liveArticles = await fetchArticlesForTopic(topic);

  if (!liveArticles || liveArticles.length === 0) {
    console.log("Using local data (fallback)");
    return res.json(localStory);
  }

  const storyResponse = {
    ...localStory,
    sourcesCount: liveArticles.length,
    sources: liveArticles,
    lastUpdated: "Just now"
  };

  res.json(storyResponse);
});

app.listen(PORT, () => {
  console.log(`Skeptiq backend running at http://localhost:${PORT}`);
});
