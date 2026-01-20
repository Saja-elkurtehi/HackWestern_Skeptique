# Skeptique

Skeptique is a web app that lets you compare how different news outlets cover the same topic.  
It pulls multiple articles, shows how each source frames the story, and adds a high-level AI summary plus potential blind spots.

The goal isn’t to decide what’s true — it’s to make differences in coverage easier to spot.

This project started as a **solo hackathon project at HackWestern** and was expanded afterward.

---

## What it does

- Fetches recent articles from multiple news outlets on the same topic
- Displays each source’s framing and tone side-by-side
- Generates a combined summary of the topic using AI
- Highlights possible blind spots or missing angles in coverage
- Supports live topic search
- Light and dark modes with different visual metaphors

---

## Tech stack

**Frontend**
- React
- React Router
- Tailwind CSS
- Framer Motion

**Backend**
- Node.js
- Express
- NewsAPI
- OpenRouter (Gemini model)

---

## Disclaimer

This app does **not** determine objective truth.

AI-generated summaries and blind spots are imperfect and should be treated as a starting point for critical thinking, not a final source of authority.

---

## Future improvements

- Add a database to store previously analyzed searches
- Reduce repeated calls to NewsAPI and the AI API by caching results
- Allow reanalysis of topics over time
- Improve bias and framing detection

---

## Notes

Built for experimentation, learning, and exploring how media framing changes perception.
