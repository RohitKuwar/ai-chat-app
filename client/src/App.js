import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");

  const inputRef = useRef();
  const chatEndRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, loading]);

  const SUMMARY_THRESHOLD = 6;

  /* 🔥 STREAMING FUNCTION */
  const streamResponse = async (text) => {
    let current = "";

    // Add empty AI message first
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    for (let i = 0; i < text.length; i++) {
      current += text[i];

      await new Promise((res) => setTimeout(res, 10));

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = current;
        return updated;
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: "user", content: message };

    let updatedMessages = [...messages, userMessage];

    setLoading(true);
    setMessage('');

    try {
      /* 🔥 STEP 1: Summarize if needed */
      if (updatedMessages.length > SUMMARY_THRESHOLD) {
        const summaryRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/summarize`,
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
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat`,
        {
          messages: updatedMessages,
          mode,
          secret: process.env.REACT_APP_SECRET,
        }
      );

      const aiReply = res.data.reply;

      /* 🔥 STREAM RESPONSE INSTEAD OF DIRECT SET */
      await streamResponse(aiReply);

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
      setMessage("");
    }
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

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading}
              className="send-btn"
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