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
const SECRET_KEY = process.env.APP_SECRET || "my-secret-key";

/* 💬 Chat Endpoint */
app.post("/chat", async (req, res) => {
  try {
    const { message, secret } = req.body;

    /* 🔒 Validate Secret */
    if (secret !== SECRET_KEY) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    res.json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("ERROR:", error.message);

    if (error.code === "insufficient_quota") {
      return res.status(500).json({
        error: "API quota exceeded. Please try later.",
      });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
});

/* 🚀 Start Server */
app.listen(5000, () => console.log("Server running on port 5000"));