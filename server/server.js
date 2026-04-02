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

/* 🧠 SUMMARIZE */
app.post("/summarize", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize this conversation briefly with key context."
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

/* 💬 CHAT */
app.post("/chat", async (req, res) => {
  try {
    const { messages, secret, mode } = req.body;

    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    /* 💻 CODE MODE */
    if (mode === "code") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior developer. Generate clean code, optimize it, and explain it step-by-step."
          },
          ...messages,
        ],
      });

      return res.json({
        reply: response.choices[0].message.content,
      });
    }

    /* 📝 BLOG MODE */
    if (mode === "blog") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Write a detailed blog with headings, examples, and a catchy title."
          },
          ...messages,
        ],
      });

      return res.json({
        reply: response.choices[0].message.content,
      });
    }

    /* 💬 DEFAULT CHAT MODE (WORKFLOW) */

    // Step 1: Intent
    const intentRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Identify user intent in one short sentence"
        },
        ...messages
      ],
    });

    const intent = intentRes.choices[0].message.content;

    // Step 2: Answer
    const answerRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `User intent: ${intent}. Provide a clear answer.`
        },
        ...messages
      ],
    });

    const answer = answerRes.choices[0].message.content;

    // Step 3: Format
    const formatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Format this nicely using markdown (headings, bullet points)."
        },
        { role: "user", content: answer }
      ],
    });

    const final = formatRes.choices[0].message.content;

    res.json({ reply: final });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});