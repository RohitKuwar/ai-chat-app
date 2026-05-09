import openai from "../config/openai.js";
import Chat from "../models/Chat.js";
import { createEmbedding } from "../utils/createEmbedding.js";
import { cosineSimilarity } from "../utils/similarity.js";
import { getKeywordScore } from "../utils/getKeywordScore.js";
import { calculator, getWeather, searchWeb } from "../utils/tools.js";

const toolMap = {
  calculator,
  getWeather,
  searchWeb,
};

const tools = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          a: {
            type: "number",
            description: "First number",
          },
          b: {
            type: "number",
            description: "Second number",
          },
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
            description: "Math operation",
          },
        },
        required: ["a", "b", "operation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get current weather by city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name"
          }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchWeb",
      description: "Search the web for recent or real-time information not known by the model",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query"
          }
        },
        required: ["query"]
      }
    }
  }
];

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
    const { messages, mode, chatId } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    const recentMessages = messages.slice(-4);

    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // tells browser how to read data

    const userQuestion = messages[messages.length - 1].content;
    console.log("User Question:", userQuestion);

    let chunkEmbeddings = [];

    if (chatId && !chatId.startsWith("chat_")) {
      const chatDoc = await Chat.findById(chatId);
      chunkEmbeddings = chatDoc?.embeddings || [];
    }

    let context = "";
    let hasContext = false;

    if(chunkEmbeddings.length > 0) {
      const keywords = userQuestion.toLowerCase().split(" ").filter(word => word.length > 3);

      const cleanQuery = userQuestion.toLowerCase().replace(/\n/g, " ").replace(/\s+/g, " ").trim();

      const queryEmbedding = await createEmbedding(cleanQuery);
      const scoredChunks = chunkEmbeddings.map(chunk => {
        const semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding);
        const keywordScore = getKeywordScore(chunk.text, keywords);

        return {
          text: chunk.text,
          score: semanticScore + keywordScore,
        };
      });

      const sortedChunks = scoredChunks.sort((a, b) => b.score - a.score);

      const maxScore = sortedChunks[0]?.score || 0;

      let topChunks = [];

      if (maxScore >= 0.35) {
        topChunks = sortedChunks
          .filter(c => c.score > maxScore * 0.8)
          .slice(0, 3);
      }

      context = topChunks.map((c, index) => `Chunk ${index + 1} (Relevance Score: ${c.score.toFixed(2)}):\n${c.text}`).join("\n\n");
      console.log("Context:", context);
      console.log("Max Score:", maxScore);
      console.log("Top Chunks:", topChunks);

      hasContext = topChunks.length > 0;
    }

    /* 🧠 SYSTEM PROMPT BASED ON MODE */
    let systemPrompt;

    if (hasContext) {
      // RAG MODE (document-based)
      systemPrompt = `
        You are a helpful AI assistant with access to multiple tools.

        You are given multiple context chunks ranked by relevance.

        Context Rules:
        - Chunk 1 is the most relevant. Prioritize it.
        - Use other chunks only if needed.
        - Do NOT mix unrelated information from different chunks.
        - If the answer is clearly present in one chunk, use that chunk only.
        - If the question is related to the context, answer using it.
        - Do NOT force context if it's irrelevant.

        Tool Usage Rules:
        - Use tools only when necessary.
        - Do NOT use tools for common knowledge questions.
        - Use calculator tool only for mathematical calculations.
        - Use weather tool only for weather-related questions.
        - Use search tool only for recent or real-time information.
        - Prefer direct reasoning when possible.

        General Rules:
        - Be accurate and clear.
        - If no tool is needed, answer normally.
        - Always provide concise and helpful responses.
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        ...recentMessages,
      ],
      tools,
      tool_choice: "auto",
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    console.log("TOOL CALL:", toolCall);

    let finalResponse;

    if (toolCall) {
      const functionName = toolCall.function.name;

      console.log("SELECTED TOOL:", functionName);

      let args;

      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        return res.status(400).send("Invalid tool arguments");
      }

      console.log("TOOL ARGS:", args);

      if (!toolMap[functionName]) {
        return res.status(400).send("Invalid tool requested");
      }

      const result = await toolMap[functionName](args);

      const updatedMessages = [
        ...recentMessages,
        response.choices[0].message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: result.toString(),
        },
      ];

      finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: finalSystemPrompt,
          },
          ...updatedMessages,
        ],
      });

      return res.send(finalResponse.choices[0].message.content);
    }

    return res.send(response.choices[0].message.content);

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