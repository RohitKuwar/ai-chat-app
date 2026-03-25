import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: "user", content: message };

    const MAX_MESSAGES = 5;

    const updatedMessages = [
      ...messages,
      userMessage
    ].slice(-MAX_MESSAGES);

    setMessages(updatedMessages);
    setLoading(true);

    console.log("Sending:", updatedMessages);

    try {
      const res = await axios.post(`http://localhost:5000/chat`, {
        messages: updatedMessages,
        secret: process.env.REACT_APP_SECRET,
      });

      const aiReply = res.data.reply;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiReply }
      ]);

    } catch (err) {
      console.error(err);
      alert("Error occurred");
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
          <div key={i} className={`message ${msg.role === "user" ? "user" : "ai"}`}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
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