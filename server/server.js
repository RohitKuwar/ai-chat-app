import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* 🔐 Rate Limiter */
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
});
app.use("/chat", limiter);
app.use("/summarize", limiter);

/* 🤖 OpenAI */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* 🔑 Secret */
const SECRET_KEY = process.env.APP_SECRET?.trim();

/* 💬 CHAT API */
app.post("/chat", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    const systemMessage = {
      role: "system",
      content: "You are a helpful AI assistant. Give clear and concise answers.",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* 🧠 SUMMARIZE API */
app.post("/summarize", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const summaryPrompt = [
      {
        role: "system",
        content:
          "Summarize this conversation in a short paragraph. Keep important details.",
      },
      ...messages,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: summaryPrompt,
    });

    const summary = response.choices[0].message.content;

    res.json({ summary });

  } catch (error) {
    console.error("SUMMARY ERROR:", error);
    res.status(500).json({ error: "Summarization failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});