import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const SUMMARY_THRESHOLD = 6;

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: "user", content: message };

    let updatedMessages = [...messages, userMessage];

    setLoading(true);

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
          secret: process.env.REACT_APP_SECRET,
        }
      );

      const aiReply = res.data.reply;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiReply },
      ]);

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
      <h2>AI Chat App</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role === "user" ? "user" : "ai"}`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}

        {loading && <div className="message ai">Thinking in steps...</div>}
      </div>

      <div className="input-box">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {/* <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          rows={2}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading) {
              e.preventDefault();
              sendMessage();
            }
          }}
        /> */}

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;