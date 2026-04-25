import openai from "../config/openai.js";
import { createEmbedding } from "../utils/createEmbedding.js";
import { cosineSimilarity } from "../utils/similarity.js";

export const generateTitle = async (req, res) => {
  try {
    const { message } = req.body;

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
    const { messages } = req.body;

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
    const { messages, mode } = req.body;
    console.log('messages', messages);

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // tells browser how to read data
    res.setHeader("Transfer-Encoding", "chunked"); // enables chunk streaming
    res.setHeader("Cache-Control", "no-cache"); // prevents caching of streamed data
    res.setHeader("Connection", "keep-alive"); // keeps stream alive
    res.setHeader("Content-Encoding", "identity"); // disables compression to allow real-time streaming

    const userQuestion = messages[messages.length - 1].content;
    console.log("User Question:", userQuestion);
    
    const chunkEmbeddings = global.chunkEmbeddings || [];

    let context = "";
    let hasContext = false;

    if(chunkEmbeddings.length > 0) {
      const queryEmbedding = await createEmbedding(userQuestion);
      const scoredChunks = chunkEmbeddings.map(chunk => ({
        text: chunk.text,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));

      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      console.log("Top Chunks:", topChunks);

      context = topChunks.map((c) => c.text).join("\n\n");
      console.log("Context:", context);

      hasContext = topChunks.length > 0;
    }

    /* 🧠 SYSTEM PROMPT BASED ON MODE */
    let systemPrompt;

    if (hasContext) {
      // RAG MODE (document-based)
      systemPrompt = `
    You are a helpful AI assistant.

    You are given some context from a document.

    Rules:
    - If the question is related to the context, answer using it.
    - If the question is NOT related to the context, answer normally using your knowledge.
    - Do NOT force context if it's irrelevant.
    - Be accurate and clear.
    `;
    } else {
      // NORMAL CHAT MODE
      systemPrompt =
        "You are a helpful AI assistant. Always respond in clean markdown format with proper spacing.";
    }

    if (mode === "code") {
      systemPrompt =
        "You are a senior developer. Generate clean code, optimize it, and explain it step-by-step using markdown.";
    }

    if (mode === "blog") {
      systemPrompt =
        "Write a detailed blog with headings, examples, and a catchy title in markdown.";
    }

    const finalSystemPrompt = hasContext ? systemPrompt + "\n\nContext:\n" + context : systemPrompt;

    /* 🔥 SINGLE STREAM CALL (OPTIMIZED) */
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
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

export const saveChat = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const { title, messages } = req.body;

    const chat = new Chat({
      userId,
      title,
      messages,
    });

    await chat.save();

    res.status(201).json({
      message: "Chat saved",
      chat,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};