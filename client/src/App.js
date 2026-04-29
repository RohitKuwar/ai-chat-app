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
  X,
  Copy,
  Download,
  Check,
  CircleUserRound,
  Paperclip
} from "lucide-react";
import AuthModal from "./AuthModal";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [mode, setMode] = useState("chat");
  const [open, setOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false);
  const [isCreateNewChat, setIsCreateNewChat] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedChat, setCopiedChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileText, setAttachedFileText] = useState('');
  const [chatsLoading, setChatsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const dropdownRef = useRef(null);
  const inputRef = useRef();
  const chatEndRef = useRef(null);
  const controllerRef = useRef(null);
  const fullTextRef = useRef("");
  const uploadControllerRef = useRef(null);

  const SUMMARY_THRESHOLD = 20;
  const FREE_CHAT_LIMIT = 10;

  const currentChat = chats.find((c) => c.id === currentChatId);

  // MOBILE
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-container")) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* LOAD DATA (DB vs localStorage) */
  useEffect(() => {
    if (token) {
      fetchChats();
    } else {
      const userId = localStorage.getItem("user_id");
      const saved = localStorage.getItem(`chats_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setChats(parsed);
        setCurrentChatId(parsed[0]?.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* SAVE LOCAL CHAT (guest only) */
  useEffect(() => {
    if (!token && chats.length > 0) {
      const userId = localStorage.getItem("user_id");
      localStorage.setItem(`chats_${userId}`, JSON.stringify(chats));
    }
  }, [chats, token]);

  /* GENERATE USER ID */ 
  useEffect(() => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = "user_" + Date.now();
      localStorage.setItem("user_id", userId);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!currentChat) return;
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [currentChat]);

  const selectMode = (value) => {
    setMode(value);
    setOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mobToggleSidebar = () => {
    setMobSidebarOpen(!mobSidebarOpen);
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const highlightText = (text, search) => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className="highlight">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const formatChat = (messages) => {
    return messages
      .map((msg) => {
        const role = msg.role === "user" ? "You" : "AI";

        return `
  ========================
  ${role}
  ------------------------
  ${msg.content}
  `;
      })
      .join("\n");
  };

  const copyChat = () => {
    if (!currentChat) return;

    const text = formatChat(currentChat.messages);

    navigator.clipboard.writeText(text);
  };

  const exportChat = () => {
    if (!currentChat) return;

    const text = formatChat(currentChat.messages);

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentChat.title || "chat"}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleCopyChat = () => {
    copyChat(); // your existing function

    setCopiedChat(true);

    setTimeout(() => {
      setCopiedChat(false);
    }, 1500);
  };

  useEffect(() => {
    setIsCreateNewChat(true);
    setCurrentChatId(null);
  }, []);


  const fetchChats = async () => {
    setChatsLoading(true);
    const currentToken = localStorage.getItem("token");

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/chat`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const formattedChats = res.data.chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        messages: chat.messages,
      }));

      setChats(formattedChats);
      setCurrentChatId(formattedChats[0]?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setChatsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    setToken(null); 
    setUser(null); 
    setIsAuthenticated(false); 
    setChats([]); 
    setCurrentChatId(null);
  };

  const createNewChat = () => {
    // const newChat = {
    //   id: "chat_" + Date.now(),
    //   title: "New Chat",
    //   messages: [],
    // };
    // setChats((prev) => [newChat, ...prev]);
    // setCurrentChatId(newChat.id);
    // setIsCreateNewChat(true);
    setCurrentChatId(null);
    setIsCreateNewChat(true);
  };

  const generateTitle = async (msg, chatId) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/generate-title`,
        {
          message: msg,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: res.data.title } : chat,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };  

  const sendMessage = async () => {
    setAttachedFile(null);
    setAttachedFileText('');
    if (!message.trim() || loading || isStreaming) return;

    let chat = isCreateNewChat ? null : currentChat;
    let chatId;

    const userMessageCount = chat?.messages?.filter(
      (m) => m.role === "user",
    ).length;
    
    if (!token && userMessageCount >= FREE_CHAT_LIMIT) {
      setShowAuthModal(true);
      return;
    }

    // AUTO CREATE CHAT IF NONE EXISTS
    if (!chat) {
      let newId = "chat_" + Date.now();

      // 🔥 If logged in → create DB chat immediately
      if (token) {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/chat/save`,
          {
            title: "New Chat",
            messages: [],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        newId = res.data.chat._id;
      }

      const newChat = {
        id: newId,
        title: "New Chat",
        messages: [],
      };

      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newId);
      setIsCreateNewChat(false);

      chat = newChat;
      chatId = newId;

      // ✅ Always generate title
      // generateTitle(message, newId);
    } else {
      chatId = chat.id;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    // const chatId = chat.id;
    const userMessage = { role: "user", content: message };
    let updatedMessages = [...chat.messages, userMessage];

    setMessage("");
    setLoading(true);
    setIsWriting(false);

    try {
      let title = chat.title;

      /* 🔥 STEP 1: Summarize if needed */
      if (updatedMessages.length > SUMMARY_THRESHOLD) {
        const summaryRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/ai/summarize`,
          {
            messages: updatedMessages.slice(0, -3),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const summary = summaryRes.data.summary;

        updatedMessages = [
          { role: "system", content: summary },
          ...updatedMessages.slice(-3),
        ];
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: updatedMessages, title }
            : chat,
        ),
      );

      /* 🔥 STEP 2: Chat API */
      const response = await fetch(
        `http://localhost:5000/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
            mode,
            chatId: chatId
          }),
        },
      );

      if (response.status === 401) {
        setShowAuthModal(true);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, { role: "assistant", content: "" }],
              }
            : chat,
        ),
      );

      setIsStreaming(true);
      fullTextRef.current = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullTextRef.current += chunk;

        // 🔥 FIRST CHUNK = WRITING START
        if (!isWriting && chunk.trim() !== "") {
          setIsWriting(true);
        }


        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== chatId) return chat;
            const msgs = [...chat.messages];
            msgs[msgs.length - 1].content = fullTextRef.current;
            return { ...chat, messages: msgs };
          }),
        );
      }

      setIsStreaming(false);
      setIsWriting(false);

      const assistantMessage = { role: "assistant", content: fullTextRef.current };

      const finalMessages = [...updatedMessages, assistantMessage];

      // setChats(prev =>
      //   prev.map(c =>
      //     c.id === chatId ? { ...c, title: "Generating..." } : c
      //   )
      // );

      // Generate title for first user message
      if (token && finalMessages.length === 2) {
        generateTitle(userMessage.content, chatId);
      }

      if (token) {
        if (chatId.startsWith("chat_")) {
          // 🔥 CREATE
          const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/chat/save`, {
            title,
            messages: finalMessages,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

          // 🔥 Replace temp id with DB id
          const newId = res.data.chat._id;

          setChats(prev =>
            prev.map(chat =>
              chat.id === chatId ? { ...chat, id: newId } : chat
            )
          );

          setCurrentChatId(newId);

        } else {
          // 🔥 UPDATE
          if (token) {
            await axios.put(
              `${process.env.REACT_APP_API_URL}/api/chat/update`,
              {
                chatId,
                title,
                messages: finalMessages,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }
      }
}
    } catch (err) {
      console.error("Error:", err);
      setIsStreaming(false);
      alert("Something went wrong: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    if (chatId.startsWith("chat_")) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      return;
    }

    if (!token) return;
    setDeletingId(chatId);
    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/chat/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setDeletingId(null);

    setChats(prev => prev.filter(c => c.id !== chatId));

    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const renameChat = async (chatId, newTitle) => {
    if (!token) return;

    await axios.put(
      `${process.env.REACT_APP_API_URL}/api/chat/rename`,
      {
        chatId,
        title: newTitle,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setChats(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, title: newTitle } : c
      )
    );
  };

  const stopGeneration = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setIsUploading(true);
    setAttachedFile(file.name);

    let chatIdToUse = currentChatId;

    try {
      // 🔥 STEP 1: Ensure chat exists BEFORE upload
      if (!chatIdToUse) {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/chat/save`,
          {
            title: "New Chat",
            messages: [],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        chatIdToUse = res.data.chat._id;

        const newChat = {
          id: chatIdToUse,
          title: "New Chat",
          messages: [],
        };

        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(chatIdToUse);
        setIsCreateNewChat(false);
      }

      // 🔥 STEP 2: Upload with VALID chatId
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", chatIdToUse);

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("Upload success:", data);

    } catch (err) {
      console.error("Upload failed:", err);
      setAttachedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const discardFile = () => {
    // Cancel upload if still in progress
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
    }
    setAttachedFile(null);
    setAttachedFileText('');
    setIsUploading(false);
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
          renameChat={renameChat}
          setIsCreateNewChat={setIsCreateNewChat}
          highlightText={highlightText}
          setShowAuthModal={setShowAuthModal}
          token={token}
          user={user}
          chatsLoading={chatsLoading}
          deletingId={deletingId}
        />
      </div>
      <div
        className={`${sidebarOpen ? "chat-container" : "chat-container-expand"}`}
      >
        {isMobile && (
          <div className="chat-header">
            {mobSidebarOpen ? (
              <X size={16} onClick={mobToggleSidebar} title="Close menu" />
            ) : (
              <Menu size={16} onClick={mobToggleSidebar} title="Open menu" />
            )}

            {/* <div style={{ display: "flex", gap: "10px", alignItems: "center" }}> */}
            <span>AI Chat Studio</span>

            {isAuthenticated ? (
              <div className="profile-container">
                <CircleUserRound
                  size={18}
                  className="profile-icon"
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                />

                {showUserDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-name">{user?.name || "User"}</div>

                    <div className="profile-logout" onClick={handleLogout}>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="auth-btn"
              >
                Login
              </button>
            )}
            {/* </div> */}
          </div>
        )}

        {isMobile && (
          <div
            className={`backdrop ${mobSidebarOpen ? "show" : ""}`}
            onClick={() => {
              setMobSidebarOpen(false);
              setSearch("");
            }}
          >
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
              renameChat={renameChat}
              setIsCreateNewChat={setIsCreateNewChat}
              highlightText={highlightText}
              setShowAuthModal={setShowAuthModal}
              token={token}
              user={user}
              chatsLoading={chatsLoading}
              deletingId={deletingId}
            />
          </div>
        )}

        {!isMobile && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            {isAuthenticated ? (
              <div className="profile-container">
                <CircleUserRound
                  size={22}
                  className="profile-icon"
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                />

                {showUserDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-name">{user?.name || "User"}</div>

                    <div className="profile-logout" onClick={handleLogout}>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="auth-btn"
              >
                Login
              </button>
            )}
          </div>
        )}

        {isCreateNewChat ? (
          <div className="welcome-screen">
            <h1 className="welcome-title">What can I help with?</h1>

            <div className="suggestions">
              <button onClick={() => setMessage("Explain React hooks")}>
                Explain React hooks
              </button>
              <button onClick={() => setMessage("Write Fibonacci in JS")}>
                Write Fibonacci in JS
              </button>
              <button onClick={() => setMessage("Create a blog on AI")}>
                Create a blog on AI
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-box">
            {currentChat?.messages.map((msg, i) => (
              <div
                key={i}
                className={`message-wrapper ${msg.role === "user" ? "user-wrapper" : "ai-wrapper"}`}
              >
                <div
                  // key={i}
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

                {/* Copy action row — shown on hover below the bubble */}
                <div className="msg-actions">
                  {copiedId === i ? (
                    <span className="msg-action-btn copied-feedback">
                      <Check size={12} />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <button
                      className="msg-action-btn"
                      title="Copy message"
                      onClick={() => handleCopy(msg.content, i)}
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* {loading && (
              <div className="message ai typing">
                Thinking<span className="dots"></span>
              </div>
            )} */}

            {loading && !isWriting && (
              <div className="message ai typing">
                Thinking<span className="dots"></span>
              </div>
            )}

            {isStreaming && isWriting && (
              <div className="message ai typing">
                Writing<span className="dots"></span>
              </div>
            )}

            <div ref={chatEndRef} />

            {!isStreaming && currentChat?.messages.length > 0 && (
              <div className="message-actions">
                {copiedChat ? (
                  <Check
                    size={16}
                    className="copied-chat-icon"
                    title="Chat Copied"
                    data-tooltip="Chat Copied"
                  />
                ) : (
                  <Copy
                    size={16}
                    onClick={handleCopyChat}
                    className="copy-chat"
                    title="Copy Chat"
                    data-tooltip="Copy Chat"
                  />
                )}
                <Download
                  size={16}
                  onClick={exportChat}
                  className="export-chat"
                  title="Export Chat"
                  data-tooltip="Export Chat"
                />
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="input-wrapper">
          {attachedFile && (
            <div className="attached-file-wrap">
              <div
                className={`attached-file-chip ${isUploading ? "uploading" : ""}`}
              >
                {isUploading ? (
                  <span className="attach-spinner" />
                ) : (
                  <Paperclip size={12} />
                )}
                <span className="attached-file-name">
                  {isUploading ? `Uploading ${attachedFile}...` : attachedFile}
                </span>
                <button
                  className="attached-file-discard"
                  onClick={discardFile}
                  title={isUploading ? "Cancel upload" : "Remove file"}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

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

            {/* <input type="file" onChange={handleUpload} /> */}

            <input
              type="file"
              id="file-upload"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <label
              htmlFor="file-upload"
              className={`attach-btn ${isUploading ? "attach-btn-disabled" : ""}`}
              title="Attach file"
              onClick={(e) => {
                if (!token) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }}
            >
              <Paperclip size={16} />
            </label>

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

            {/* <Paperclip size={18} color="white" /> */}

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
                disabled={loading || isUploading}
                className="send-btn"
                title="send message"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(userData) => {
          const newToken = localStorage.getItem("token");
          setToken(newToken);
          setUser(userData);
          setIsAuthenticated(true);
          fetchChats();
        }}
      />
    </div>
  );
}

export default App;