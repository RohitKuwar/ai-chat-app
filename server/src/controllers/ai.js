import openai from "../config/openai.js";
import Chat from "../models/Chat.js";
import { createEmbedding } from "../utils/createEmbedding.js";
import { cosineSimilarity } from "../utils/similarity.js";
import { getKeywordScore } from "../utils/getKeywordScore.js";
import { calculator, getWeather, searchWeb, toolMap } from "../utils/tools.js";
import { executeTool } from "../utils/toolExecutor.js";
import { AGENT_SYSTEM_PROMPT, AGENT_RAG_PROMPT } from "../utils/prompts.js";

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

    const recentMessages = messages.slice(-6);

    console.log("RECENT MESSAGES:", recentMessages);

    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // tells browser how to read data
    res.setHeader("Transfer-Encoding", "chunked"); // enables chunk streaming
    res.setHeader("Cache-Control", "no-cache"); // prevents caching of streamed data
    res.setHeader("Connection", "keep-alive"); // keeps stream alive
    res.setHeader("Content-Encoding", "identity"); // disables compression to allow real-time streaming

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
    let systemPrompt = hasContext ? AGENT_RAG_PROMPT : AGENT_SYSTEM_PROMPT;

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

    const toolCalls = response.choices[0]?.message?.tool_calls || [];

    console.log("TOOL CALLS:", toolCalls);

    if (toolCalls.length === 0) {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        ...recentMessages,
      ],
    });

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content || "";
        res.write(content);
      }
      res.end();
      return;
    }

    const toolResults = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;

      console.log("EXECUTING TOOL:", functionName);

      const result = await executeTool(toolCall);

      toolResults.push({
        toolCall,
        result,
      });
    }

    const toolMessages = toolResults.map(
      ({ toolCall, result }) => ({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.toString(),
      })
    );

    const updatedMessages = [
      ...recentMessages,
      response.choices[0].message,
      ...toolMessages
    ];

    console.log("TOTAL TOOL CALLS:", toolCalls.length);

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        ...updatedMessages,
      ],
    });

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content || "";

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