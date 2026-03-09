// server.js - Render Backend
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// Environment Variables في Render Dashboard:
// NVIDIA_API_KEY = nvapi-xxxxxxxxxxxx
// DEEPSEEK_API_KEY = sk-xxxxxxxxxxxx

// NVIDIA Proxy Endpoint
app.post("/api/nvidia/chat", async (req, res) => {
  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model:
            req.body.model || "nvidia/llama-3.1-nemotron-70b-instruct",
          messages: req.body.messages,
          max_tokens: req.body.max_tokens || 4096,
          temperature: req.body.temperature || 0.3,
          stream: false
        })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DeepSeek Proxy Endpoint
app.post("/api/deepseek/chat", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: req.body.model || "deepseek-chat",
          messages: req.body.messages,
          max_tokens: req.body.max_tokens || 4096,
          temperature: req.body.temperature || 0.3
        })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    nvidia: !!process.env.NVIDIA_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
