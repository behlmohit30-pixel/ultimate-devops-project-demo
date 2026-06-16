const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PROXY_PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
}

// Proxy Anthropic API calls — keeps the API key server-side
app.post("/api/anthropic/v1/messages", async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not set on server" } });
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// SPA fallback in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study App proxy listening on :${PORT}`);
  if (!ANTHROPIC_API_KEY) console.warn("WARNING: ANTHROPIC_API_KEY is not set");
});
