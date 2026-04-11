import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import "./App.css";
import {
  Send,
  Square,
  Trash2,
  MessageSquare,
  Code,
  FileText,
  ChevronDown
} from "lucide-react";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [open, setOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef();
  const chatEndRef = useRef(null);
  const controllerRef = useRef(null);

  const SUMMARY_THRESHOLD = 6;

  const selectMode = (value) => {
    setMode(value);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

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

    const controller = new AbortController();
    controllerRef.current = controller;

    const userMessage = { role: "user", content: message };

    let updatedMessages = [...messages, userMessage];

    setLoading(true);
    setMessage('');

    try {
      /* 🔥 STEP 1: Summarize if needed */
      if (updatedMessages.length > SUMMARY_THRESHOLD) {
        const summaryRes = await axios.post(
          `${process.env.REACT_APP_API_URL}summarize`,
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
      `${process.env.REACT_APP_API_URL}/chat`,
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
        signal: controller.signal,
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
      if (controller.signal.aborted) break;
      
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
        if(err.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Error:", err);
        alert("Something went wrong: " + (err?.message || err));
        setIsStreaming(false);
      }
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

  const stopGeneration = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
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
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                }}
              >
                {msg.content}
              </ReactMarkdown>
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
            <div className="mode-dropdown" ref={dropdownRef}>
              <div
                className="mode-selected"
                onClick={() => setOpen(!open)}
              >
                {mode === "chat" && <MessageSquare size={16} />}
                {mode === "code" && <Code size={16} />}
                {mode === "blog" && <FileText size={16} />}

                <span>{mode}</span>
                <ChevronDown size={14} />
              </div>

              {open && (
                <div className="dropdown-menu">
                  <div onClick={() => selectMode("chat")}>
                    <MessageSquare size={16} /> Chat
                  </div>
                  <div onClick={() => selectMode("code")}>
                    <Code size={16} /> Code
                  </div>
                  <div onClick={() => selectMode("blog")}>
                    <FileText size={16} /> Blog
                  </div>
                </div>
              )}
            </div>

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
              title="clear chat"
            >
              <Trash2 size={18} />
            </button>

            {/* Send & Abort Button */}
            {isStreaming ? (
              <button onClick={stopGeneration} className="stop-btn" title="stop generation">
                <Square fill="red" size={18} />
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={loading}
                className="send-btn"
                title="send message"
              >
                <Send size={18} />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
