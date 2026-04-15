import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import CodeBlock from "./CodeBlock";
import "./App.css";
import {
  Send,
  MessageSquare,
  Code,
  FileText,
  ChevronDown,
  CirclePause,
  Menu,
  X
} from "lucide-react";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [open, setOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false);
  const [isCreateNewChat, setIsCreateNewChat] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const dropdownRef = useRef(null);
  const inputRef = useRef();
  const chatEndRef = useRef(null);
  const controllerRef = useRef(null);
  const fullTextRef = useRef("");
  const isMobile = window.innerWidth <= 768;

  const SUMMARY_THRESHOLD = 6;

  const currentChat = chats.find(c => c.id === currentChatId);

  const selectMode = (value) => {
    setMode(value);
    setOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  }

  const mobToggleSidebar = () => {
    setMobSidebarOpen(!mobSidebarOpen);
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const highlightText = (text, search) => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase()
        ? <span key={i} className="highlight">{part}</span>
        : part
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setIsCreateNewChat(true);
    setCurrentChatId(null);
  }, [])

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
    const saved = localStorage.getItem(`chats_${userId}`);

    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      setCurrentChatId(parsed[0]?.id);
    }
  }, []);

  /* 💾 STEP 3: SAVE USER CHAT */
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (chats.length > 0) {
      localStorage.setItem(`chats_${userId}`, JSON.stringify(chats));
    }
  }, [chats]);

  /* CREATE NEW CHAT */
  const createNewChat = () => {
    setIsCreateNewChat(true);
    const newChat = {
      id: "chat_" + Date.now(),
      title: message || "New Chat",
      messages: []
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [chats, loading, isStreaming]);

  const generateTitle = async (msg) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/generate-title`,
        {
          message: msg,
          secret: process.env.REACT_APP_SECRET,
        }
      );

      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, title: res.data.title }
            : chat
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    setIsCreateNewChat(false);

    if (!message.trim() || loading || isStreaming) return;

    let chat = currentChat;

    // 👉 AUTO CREATE CHAT IF NONE EXISTS
    if (!chat) {
      const newChat = {
        id: "chat_" + Date.now(),
        title: message || "New Chat",
        messages: []
      };

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      chat = newChat;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    const userMessage = { role: "user", content: message };

    let updatedMessages = [...chat.messages, userMessage];

    setLoading(true);

    const currentMessage = message; // capture before clearing
    setMessage("");

    const chatId = chat.id; // capture before state updates

    try {
      let title = chat.title;
      if (chat.messages.length === 0) {
        title = currentMessage.slice(0, 30);

        // async AI title (non-blocking)
        generateTitle(currentMessage);
      }

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

      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: updatedMessages, title }
            : chat
        )
      );

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

    setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, { role: "assistant", content: "" }],
              }
            : chat
        )
      );

    setIsStreaming(true);

    fullTextRef.current = "";
    while (true) {
      if (controller.signal.aborted) break;
      
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullTextRef.current += chunk;

      setChats(prev =>
        prev.map(chat => {
          if (chat.id !== chatId) return chat;

          const msgs = [...chat.messages];
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            content: fullTextRef.current,
          };

          return { ...chat, messages: msgs };
        })
      );
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

  // const clearMessages = () => {
  //   if (!currentChat) return;

  //   setChats(prev =>
  //     prev.map(chat =>
  //       chat.id === currentChatId ? { ...chat, messages: [] } : chat
  //     )
  //   );
  // };

  const deleteChat = (id) => {
    const updated = chats.filter(chat => chat.id !== id);
    setChats(updated);

    if (currentChatId === id) {
      setCurrentChatId(updated[0]?.id || null);
    }
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
      <div
        className={`${sidebarOpen ? "sidebar-container" : "sidebar-container-shrink"}`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          onToggle={toggleSidebar}
          createNewChat={createNewChat}
          search={search}
          setSearch={setSearch}
          chats={filteredChats}
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          deleteChat={deleteChat}
          setIsCreateNewChat={setIsCreateNewChat}
          highlightText={highlightText}
        />
      </div>
      <div
        className={`${sidebarOpen ? "chat-container" : "chat-container-expand"}`}
      >
        {isMobile && (
          <div className="chat-header">
            {
              mobSidebarOpen ? (
                <X size={16} onClick={mobToggleSidebar} title="Close menu" />
              ) : (
                <Menu size={16} onClick={mobToggleSidebar} title="Open menu" />
              )
            }
            <span>AI Chat Studio</span>
          </div>
        )}

        {isMobile && (
          <div className={`backdrop ${mobSidebarOpen ? "show" : ""}`} onClick={() => setMobSidebarOpen(false)}>
            <MobileSidebar
              mobSidebarOpen={mobSidebarOpen}
              setMobSidebarOpen={setMobSidebarOpen}
              onToggle={mobToggleSidebar}
              createNewChat={createNewChat}
              search={search}
              setSearch={setSearch}
              chats={filteredChats}
              currentChatId={currentChatId}
              setCurrentChatId={setCurrentChatId}
              deleteChat={deleteChat}
              setIsCreateNewChat={setIsCreateNewChat}
              highlightText={highlightText}
            />
          </div>
        )}

        {isCreateNewChat ? (
          <div className="welcome-screen">
            <h1 className="welcome-title">What can I help with?</h1>
            <p className="welcome-sub">Start a conversation below.</p>
          </div>
        ) : (
          <div className="chat-box">
            {currentChat?.messages.map((msg, i) => (
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

            {loading && <div className="message ai">Thinking...</div>}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="input-wrapper">
          <div className="input-bar">
            {/* Mode Dropdown */}
            <div className="mode-dropdown" ref={dropdownRef}>
              <div className="mode-selected" onClick={() => setOpen(!open)}>
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
            {/* <button
              onClick={clearMessages}
              disabled={loading || isStreaming}
              className="clear-btn"
              title="clear chat"
            >
              <Trash2 size={18} />
            </button> */}

            {/* Send & Abort Button */}
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="stop-btn"
                title="stop generation"
              >
                <CirclePause size={18} />
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
