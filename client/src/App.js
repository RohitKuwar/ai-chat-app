import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: "user", text: message };
    setChat((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        message,
        secret: process.env.REACT_APP_SECRET,
      });

      const aiMessage = { role: "ai", text: res.data.reply };
      setChat((prev) => [...prev, aiMessage]);

    } catch (err) {
      if (err.response?.status === 429) {
        alert("Too many requests. Please try later.");
      } else if (err.response?.status === 403) {
        alert("Unauthorized request.");
      } else {
        alert("Something went wrong.");
      }
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  return (
    <div className="app">
      <h2>AI Chat App</h2>

      <div className="chat-box">
        {chat.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}

        {loading && <div className="message ai">Typing...</div>}
      </div>

      <div className="input-box">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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