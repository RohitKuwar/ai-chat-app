import openai from "../config/openai.js";
import { SECRET_KEY } from "../utils/constants.js";

export const generateTitle = async (req, res) => {
  try {
    const { message, secret } = req.body;

    if ((secret || "").trim() !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Generate a short title (max 6 words)." },
        { role: "user", content: message },
      ],
    });

    res.json({ title: response.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "Title generation failed" });
  }
};

export const summarize = async (req, res) => {
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
};

export const chat = async (req, res) => {
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
};