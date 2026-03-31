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

/* 🧠 SUMMARIZE API (Week 2 Day 7) */
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
          "Summarize this conversation in a short paragraph. Keep important context."
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

/* 💬 CHAT API (Week 3 Day 3 — Workflow) */
app.post("/chat", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    console.log("Incoming messages:", messages);

    /* 🧠 STEP 1: Intent */
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
    console.log("Intent:", intent);

    /* 💬 STEP 2: Answer */
    const answerRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `User intent: ${intent}. Give a clear and helpful answer.`
        },
        ...messages
      ],
    });

    const answer = answerRes.choices[0].message.content;

    /* 🎨 STEP 3: Format */
    const formatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Format the response in clean markdown with headings, bullet points."
        },
        {
          role: "user",
          content: answer
        }
      ],
    });

    const final = formatRes.choices[0].message.content;

    res.json({ reply: final });

  } catch (error) {
    console.error("WORKFLOW ERROR:", error);
    res.status(500).json({
      error: error.message || "Something went wrong"
    });
  }
});

/* 🚀 Start Server */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});