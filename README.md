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
