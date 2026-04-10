import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [isStreaming, setIsStreaming] = useState(false);

  const inputRef = useRef();
  const chatEndRef = useRef(null);

  const SUMMARY_THRESHOLD = 6;

  /* 🔐 STEP 1: GENERATE USER ID */
  useEffect(() => {
    let userId = localStorage.getItem("user_id");

    if (!userId) {
      userId = "user_" + Date.now();
      localStorage.setItem("user_id", userId);
    }
  }, []);

  /* 🔥 STEP 2: LOAD USER CHAT */
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    const saved = localStorage.getItem(`chat_${userId}`);

    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  /* 💾 STEP 3: SAVE USER CHAT */
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    if (messages.length > 0) {
      localStorage.setItem(
        `chat_${userId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, loading, isStreaming]);

  const sendMessage = async () => {
    if (!message.trim() || loading || isStreaming) return;

    const userMessage = { role: "user", content: message };

    let updatedMessages = [...messages, userMessage];

    setLoading(true);
    setMessage('');

    try {
      /* 🔥 STEP 1: Summarize if needed */
      if (updatedMessages.length > SUMMARY_THRESHOLD) {
        const summaryRes = await axios.post(
          `http://localhost:5000/summarize`,
          {
            messages: updatedMessages.slice(0, -3),
            secret: process.env.REACT_APP_SECRET,
          }
        );

        const summary = summaryRes.data.summary;

        updatedMessages = [
          { role: "system", content: summary },
          ...updatedMessages.slice(-3),
        ];
      }

      setMessages(updatedMessages);

      /* 🔥 STEP 2: Chat API */
      const response = await fetch(
      `http://localhost:5000/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          mode,
          secret: process.env.REACT_APP_SECRET,
        }),
      }
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    setIsStreaming(true);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      setMessages((prev) => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + chunk,
        };

        return updated;
      });
    }

    setIsStreaming(false);

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    if (!window.confirm("Clear chat history?")) return;

    const userId = localStorage.getItem("user_id");
    localStorage.removeItem(`chat_${userId}`);
    setMessages([]);
  };

  return (
    <div className="app">
      <div className="chat-container">

        <h2>AI Chat App</h2>

        {/* Chat Messages */}
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.role === "user" ? "user" : "ai"}`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}

          {loading && (
            <div className="message ai">Thinking...</div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-wrapper">
          <div className="input-bar">

            {/* Mode Dropdown */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mode-select"
              title="select mode"
            >
              <option value="chat">💬 Chat</option>
              <option value="code">💻 Code</option>
              <option value="blog">📝 Blog</option>
            </select>

            {/* Input */}
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask something..."
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            {/* 🗑 Clear Chat */}
            <button
              onClick={clearMessages}
              disabled={loading || isStreaming}
              className="clear-btn"
              title="Clear chat"
            >
              🗑
            </button>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading || isStreaming}
              className="send-btn"
              title="send message"
            >
              ➤
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;