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
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // max 10 requests per IP
  message: "Too many requests. Please try again later.",
});

app.use("/chat", limiter);

/* 🤖 OpenAI Setup */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* 🔑 Basic Protection Key */
const SECRET_KEY = process.env.APP_SECRET?.trim() || "my-secret-key";

/* 💬 Chat Endpoint */
app.post("/chat", async (req, res) => {
  try {
    const { messages, secret } = req.body;

    /* 🔒 Validate Secret */
    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    /* ❗ Validate Messages */
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    console.log("Incoming messages:", messages);

    /* 🤖 OpenAI Chat Call */
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map(m => ({
        role: m.role,
        content: [
          {
            type: "text",
            text: m.content
          }
        ]
      })),
    });

    const message = response.choices[0].message;

    let reply = "";

    if (typeof message.content === "string") {
      reply = message.content;
    } else if (Array.isArray(message.content)) {
      reply = message.content.map(c => c.text || "").join("");
    }

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);

    /* 🔍 Better Error Debugging */
    if (error.response) {
      console.error("OpenAI Error:", error.response.data);
    }

    res.status(500).json({
      error: error.message || "Something went wrong",
    });
  }
});

/* 🚀 Start Server */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});