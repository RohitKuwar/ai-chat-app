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

app.post("/generate-title", async (req, res) => {
  try {
    const { message, secret } = req.body;

    if ((secret || "").trim() !== (SECRET_KEY || "").trim()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate a short, clear title (max 6 words) for this conversation.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const title = response.choices[0].message.content;

    res.json({ title });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Title generation failed" });
  }
});

/* 🧠 SUMMARIZE */
app.post("/summarize", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    if ((secret || "").trim() !== (SECRET_KEY || "").trim()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize this conversation briefly with key context.",
        },
        ...messages,
      ],
    });

    res.json({
      summary: response.choices[0].message.content,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Summarization failed" });
  }
});

/* 💬 CHAT (REAL STREAMING) */
app.post("/chat", async (req, res) => {
  try {
    const { messages, secret, mode } = req.body;

    if ((secret || "").trim() !== (SECRET_KEY || "").trim()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // tells browser how to read data
    res.setHeader("Transfer-Encoding", "chunked"); // enables chunk streaming
    res.setHeader("Cache-Control", "no-cache"); // prevents caching of streamed data
    res.setHeader("Connection", "keep-alive"); // keeps stream alive
    res.setHeader("Content-Encoding", "identity"); // disables compression to allow real-time streaming

    /* 🧠 SYSTEM PROMPT BASED ON MODE */
    let systemPrompt = "You are a helpful AI assistant. Always respond in clean markdown format with proper spacing.";

    if (mode === "code") {
      systemPrompt =
        "You are a senior developer. Generate clean code, optimize it, and explain it step-by-step using markdown.";
    }

    if (mode === "blog") {
      systemPrompt =
        "Write a detailed blog with headings, examples, and a catchy title in markdown.";
    }

    /* 🔥 SINGLE STREAM CALL (OPTIMIZED) */
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(content);
    }

    res.end();

  } catch (error) {
    console.error("STREAM ERROR:", error);
    res.write("Error generating response");
    res.end();
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
