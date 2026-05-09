# AI Chat Studio (React + OpenAI)

## 🚀 Features
- Basic chat interface
- OpenAI integration
- Simple UI

## 🛠 Tech Stack
- React
- Node.js
- Express
- OpenAI API

## 📁 Structure
client/ → React frontend  
server/ → Node backend  

## ⚙️ Setup

### Backend
cd server  
npm install  
npm start  

### Frontend
cd client  
npm install  
npm start  

## 📌 Progress

### 🔹 Week 1 — AI Foundations
- Day 1: Learned fundamentals of AI, ML, and LLMs  
- Day 2: Understood tokens and context window (how AI reads input)  
- Day 3: Explored temperature and randomness in AI responses  
- Day 4: Learned embeddings and how AI understands text  
- Day 5: Implemented RAG (Retrieval Augmented Generation) concept  
- Day 6: Understood AI hallucinations and how to reduce them  
- Day 7: Revised core concepts and strengthened fundamentals  

---

### 🔹 Week 2 — Building AI Applications
- Day 1: Learned prompt engineering basics (writing effective prompts)  
- Day 2: Explored advanced prompting techniques (role, constraints, output control)  
- Day 3: Learned how developers use AI in real workflows
- Day 4: Built a full-stack AI chat app using React, Node.js, and OpenAI API  
- Day 5: Implemented chat memory to enable context-aware conversations  
- Day 6: Optimized chat memory by limiting message history and improving performance  
- Day 7: Added auto-summarization to retain context while reducing token usage  

---

### 🔹 Week 3 — AI System Design & Scaling
- Day 1: Learned AI workflows and breaking complex problems into steps  
- Day 2: Implemented prompt chaining for structured AI outputs  
- Day 3: Built AI workflow system (intent detection → response → formatting)  
- Day 4: Converted chatbot into a multi-feature AI app (Chat / Code / Blog modes)
- Day 5: Implemented streaming responses (typing effect) to simulate real-time AI output and improve user experience
- Day 6: Implemented chat history persistence using localStorage to retain conversations across sessions
- Day 7: Implemented user-based chat system by generating unique user IDs and storing chat history per user (authentication simulation)

---

### 🔹 Week 4 — Production-Level AI Systems
- Day 1: Implemented real-time streaming using OpenAI streaming API and fetch, enabling live AI responses similar to ChatGPT
- Day 2: Implemented Stop Generation feature using AbortController to allow users to cancel streaming AI responses in real-time
- Day 3: Built chat sessions with sidebar to manage multiple conversations, enabling users to create, switch, and persist chats similar to ChatGPT
- Day 4: Implemented AI-generated chat titles to automatically create meaningful conversation names, improving user experience and chat organization
- Day 5: Implemented chat search with debouncing and highlighting, improving navigation and scalability for managing multiple conversations
- Day 6: Implemented chat export and copy functionality, allowing users to copy full conversations and download chats as text files for better usability and sharing
- Day 7: Focused on improving overall user experience and making the application feel more like a production-ready product.

---

### 🔹 Week 5 — Backend Architecture
- Day 1: Refactored backend into MVC architecture, added signup/login with JWT authentication, moved AI logic to controllers, fixed env loading issue, and standardized entry file to index.js.
- Day 2: Implemented authentication UI using a modal-based approach to maintain seamless chat experience.
- Day 3: Added JWT auth middleware to protect backend routes and verify users via Authorization headers. Updated frontend to send token with API calls and handle unauthorized access via auth modal.
- Day 4: Save chats to MongoDB and link them with userId. Implemented backend API for storing chat conversations.
- Day 5: Fetch user-specific chats from database and display in sidebar. Replaced localStorage with backend data for authenticated users.
- Day 6: Implemented update chat API to append messages instead of creating new chats. Prevent duplicate chats by distinguishing between new and existing chat.
- Day 7: Implemented delete and rename chat functionality with backend APIs. Added sidebar UX controls for managing chats effectively.

---

### 🔹 Week 6 — Retrieval Augmented Generation (RAG)
- Day 1: Learned Retrieval Augmented Generation (RAG) and why LLMs need external data. Understood how search + context improves AI accuracy and reduces hallucination.
- Day 2: Implemented file upload API with PDF/text parsing using multer and pdf-parse. Converted documents into raw text to prepare for RAG pipeline.
- Day 3: Implemented text chunking with overlap to split large documents into smaller parts.
- Day 4: Generated embeddings for text chunks using OpenAI embedding model.
- Day 5: Implemented cosine similarity to compare embeddings and find relevant chunks.
- Day 6: Replaced global embedding storage with per-chat embeddings in database. Linked uploaded document embeddings to specific chat using chatId.
- Day 7: Optimized retrieval logic with clean text and overalap approach and added loading state in UI for chat load and chat delete.

---

### 🔹 Week 7 — Advanced RAG & Improvements
- Day 1: Implemented confidence-based filtering using similarity scores and removed low-relevance chunks to reduce noisy context and improve answer precision.
- Day 2: Improved context ranking by structuring retrieved chunks based on relevance and updating system prompt to prioritize higher-ranked chunks. Ensured AI focuses on the most relevant information first, reducing incorrect answers caused by poor context utilization.
- Day 3: Implemented hybrid search by combining semantic similarity with keyword-based scoring. Added keyword extraction from user queries and boosted chunk relevance using keyword matching, improving retrieval accuracy for structured data like emails, phone numbers, and IDs.
- Day 4: Implemented conversation memory by passing recent chat messages along with the current query. Enabled AI to understand follow-up questions and maintain conversational context, improving user experience and making interactions more natural.
- Day 5: Optimized performance by introducing query embedding caching, limiting chunk processing, and reducing context size. Minimized unnecessary computations and API calls to improve response speed and efficiency.
- Day 6: Improved document Q&A user experience by enhancing new chat UX, showing attached files inside chat history, fixing attachment state across chats, adding responsive file preview modal for PDFs/images, and improving upload interaction flow for better usability and clarity.
- Day 7: Improved system reliability by handling edge cases and validations. Added protection against empty messages, unsupported file types, oversized uploads, duplicate sends, failed upload cleanup, and safer UI rendering to make the application more stable and production-ready.

### 🔹 Week 8 — AI Agents & Tool Calling
- Day 1: Learned the fundamentals of AI Agents and understood the difference between traditional LLMs and agent-based systems. Explored how agents combine reasoning, tools, memory, and decision-making to perform real-world actions.
- Day 2: Learned Function/Tool Calling basics and understood how LLMs request tool execution while the backend safely validates and executes functions. Explored the complete tool-calling architecture and execution flow.
- Day 3: Built the first AI tool using OpenAI function/tool calling. Implemented calculator tool execution flow where the LLM detects when a tool is needed, backend executes the tool safely, and the final response is generated using tool results. 
- Day 4: Implemented multi-tool AI agent architecture by adding multiple tools (calculator, weather, search) and dynamic tool orchestration using a scalable tool map. Enabled the LLM to intelligently choose and execute different tools based on user intent.
- Day 5: Improved AI agent decision-making by enhancing tool descriptions, adding decision-focused system prompts, implementing optional tool usage flow, validating tool execution, and improving orchestration logic so the AI intelligently decides when and which tools should be used.
- Day 6: Integrated conversation memory with AI tools to enable context-aware agent behavior. Improved follow-up reasoning using recent message history, enhanced system prompts for conversational continuity, and enabled tools to work intelligently across multi-step interactions.
- Day 7: Built a mini AI agent system by combining RAG, multi-tool orchestration, memory-aware reasoning, and dynamic decision-making into a modular production-style AI architecture with improved observability and clean orchestration flow.

---

## 🚀 Current Capabilities

- 💬 Chat with AI (context-aware)
- 🧠 Smart memory (with summarization)
- 🔄 AI workflows (multi-step reasoning)
- 🎯 Prompt engineering (mode-based behavior)
- 🧩 Multi-feature system (Chat / Code / Blog)
- 🔐 Rate limiting & API protection
- 🌐 Full-stack deployment (Frontend + Backend)
- 🎨 Modern UI (responsive + improved UX)

---

## 🧠 What I’m Learning

- AI system design (not just API usage)
- Prompt engineering & chaining
- Performance optimization (tokens, memory)
- Building production-ready AI apps
