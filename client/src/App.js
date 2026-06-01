/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import CodeBlock from "./CodeBlock";
import "./App.css";
import {
  Send,
  FileText,
  CirclePause,
  Menu,
  X,
  Copy,
  Download,
  Check,
  CircleUserRound,
  Paperclip,
  Mic,
  Eye,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";
import AuthModal from "./AuthModal";
import Settings from "./Settings";

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
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
  const [attachedFileUrl, setAttachedFileUrl] = useState("");
  const [attachedFileType, setAttachedFileType] = useState("");
  const [chatsLoading, setChatsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    voiceURI: "",
    theme: "",
    model: "",
    temperature: 0,
  });

  const inputRef = useRef();
  const chatEndRef = useRef(null);
  const controllerRef = useRef(null);
  const fullTextRef = useRef("");
  const uploadControllerRef = useRef(null);
  const lastMessageRef = useRef("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const SUMMARY_THRESHOLD = 20;
  const FREE_CHAT_LIMIT = 10;
  const MAX_SIZE = 5 * 1024 * 1024;

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const currentChat = chats.find((c) => c.id === currentChatId);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!voices.length) return;

    const savedVoice = voices.find((voice) => voice.voiceURI === settings.voiceURI);

    if (savedVoice) {
      setSelectedVoice(savedVoice);
    } else {
      const defaultVoice = voices.find((voice) => voice.default);

      setSelectedVoice(defaultVoice || voices[0]);
    }
  }, [voices, settings.voiceURI]);

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // MOBILE
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const fetchSettings = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(res.data.settings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleVoiceChange = async (voiceURI) => {
    const voice = voices.find((v) => v.voiceURI === voiceURI);

    setSelectedVoice(voice);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/settings`,
        {
          voiceURI,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSettings(res.data.settings);
    } catch (error) {
      console.error('Failed to save voice:', error);
    }
  };

  const regenerateResponse = async (assistantIndex) => {
    stopSpeaking();
    if (isStreaming) return;
    setChatError("");
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const chat = chats.find((c) => c.id === currentChatId);

      if (!chat) return;

      let updatedMessages = [...chat.messages];

      // 🔥 Remove old assistant response
      updatedMessages.splice(assistantIndex, 1);

      // 🔥 Add empty assistant placeholder
      updatedMessages.push({
        role: "assistant",
        content: "",
      });

      // 🔥 Update UI immediately
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: updatedMessages,
              }
            : chat,
        ),
      );

      setIsStreaming(true);
      setIsWriting(false);

      fullTextRef.current = "";

      // 🔥 Reuse same API
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages.slice(0, -1), // remove empty placeholder
            chatId: currentChatId,
          }),
          signal: controller.signal,
        },
      );

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);

        fullTextRef.current += chunk;

        // 🔥 Writing started
        if (!isWriting && chunk.trim() !== "") {
          setIsWriting(true);
        }

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== currentChatId) {
              return chat;
            }

            const msgs = [...chat.messages];

            msgs[msgs.length - 1].content = fullTextRef.current;

            return {
              ...chat,
              messages: msgs,
            };
          }),
        );
      }
    } catch (error) {
      if(error.name === "AbortError") return;
      console.error("Regeneration failed:", error);
      if (!navigator.onLine) {
        setChatError("You are offline. Check your internet connection.");
        return;
      }
      setChatError("Something went wrong. Please try again.");
    } finally {
      setIsStreaming(false);
      setIsWriting(false);
    }
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
        isPinned: chat.isPinned,
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
    stopSpeaking();
    localStorage.clear(); 
    setToken(null); 
    setUser(null); 
    setIsAuthenticated(false); 
    setChats([]); 
    setCurrentChatId(null);
    setAttachedFile(null);
  };

  const createNewChat = () => {
    stopSpeaking();
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
    setIsFirstLoad(false);
    setAttachedFile(null);
    setAttachedFileText("");
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
    stopSpeaking();
    if (loading || isUploading || cooldown) return;

    if (lastMessageRef.current.toLocaleLowerCase() === message.trim().toLocaleLowerCase()) {
      return;
    }
    setChatError("");
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

    let imageBase64 = null;

    if (selectedImage) {
      imageBase64 = await convertToBase64(selectedImage);
    }

    // const chatId = chat.id;
    const userMessage = {
      role: "user",
      content: message,
      fileName: attachedFile || null,
      fileUrl: attachedFileUrl || null,
      fileType: attachedFileType || null,
      imageUrl: attachedFileType?.startsWith("image/") ? attachedFileUrl : null,
    };
    setSelectedImage(null);

    let updatedMessages = [...chat.messages, userMessage];

    setMessage("");
    setLoading(true);
    setIsWriting(false);
    setAttachedFile(null);
    setAttachedFileText('');

    try {
      let title = chat.title;
      let aiMessages = [...updatedMessages];
      /* 🔥 STEP 1: Summarize if needed */
      if (aiMessages.length > SUMMARY_THRESHOLD) {
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

        aiMessages = [
          { role: "system", content: `Conversation Summary: ${summary}` },
          ...aiMessages.slice(-3),
        ];
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: aiMessages, title }
            : chat,
        ),
      );

      lastMessageRef.current = message.trim().toLocaleLowerCase();

      /* 🔥 STEP 2: Chat API */
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
            chatId: chatId
          }),
          signal: controller.signal,
        },
      );

      if(!response.ok) {
        if (response.status === 429) {
          setChatError("Too many requests. Please wait a moment.");
          return;
        }
        if (response.status === 401) {
          setShowAuthModal(true);
          return;
        }
        setChatError("Failed to generate response.");
        return;
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
      setCooldown(true);
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
      setSelectedImage(null);
}
    } catch (error) {
      if(error.name === "AbortError") return;
      console.error("Message send failed:", error);
      if (!navigator.onLine) {
        setChatError("You are offline. Check your internet connection.");
        return;
      }
      setChatError("Something went wrong. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setTimeout(() => setCooldown(false), 1500);
      setTimeout(() => lastMessageRef.current = "", 5000);
    }
  };

  const deleteChat = async (chatId) => {
    if (currentChatId === chatId) {
      stopSpeaking();
    }
    if (chatId.startsWith("chat_")) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      return;
    }

    if (!token) return;
    
    try {
      setDeletingId(chatId);
    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/chat/delete/${chatId}`,
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
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
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

  const pinChat = async (chatId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/chat/pin/${chatId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                isPinned: data.isPinned,
              }
            : chat,
        ),
      );
    } catch (error) {
      console.error("Pin failed:", error);
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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const fileUrl = URL.createObjectURL(file);

    if (!file) return;

    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file type");
      return;
    }

    if (file.size > MAX_SIZE) {
      alert("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setAttachedFile(file.name);
    setAttachedFileUrl(fileUrl);
    setAttachedFileType(file.type);

    if (file.type.startsWith("image/")) {
      setSelectedImage(file);
    }

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

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAttachedFileUrl(data.fileUrl);

    } catch (err) {
      console.error("Upload failed:", err);
      setAttachedFile(null);
      setAttachedFileUrl("");
      setAttachedFileType("");
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
    setSelectedImage(null);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    }

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const cleanTextForSpeech = (text) => {
  return text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`([^`]+)`/g, "$1")    // remove inline code
    .replace(/[#*_>~-]/g, "")       // remove markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // markdown links
    .replace(/\n+/g, " ")           // newlines → spaces
    .replace(/\s+/g, " ")           // extra spaces
    .trim();
};

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setSpeakingMessageId(null);
  };

  const toggleSpeech = (messageId, text) => {
    // same message clicked again
    if (speakingMessageId === messageId) {
      stopSpeaking();
      return;
    }

    // stop currently speaking message
    speechSynthesis.cancel();
    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    // const voices = speechSynthesis.getVoices();
    // const preferredVoice = voices.find(v => v.name.includes("Google 日本語"));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    setSpeakingMessageId(messageId);
    speechSynthesis.speak(utterance);
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
          pinChat={pinChat}
          setIsCreateNewChat={setIsCreateNewChat}
          highlightText={highlightText}
          setShowAuthModal={setShowAuthModal}
          token={token}
          user={user}
          chatsLoading={chatsLoading}
          deletingId={deletingId}
          setAttachedFile={setAttachedFile}
          setAttachedFileText={setAttachedFileText}
          setIsUploading={setIsUploading}
          stopSpeaking={stopSpeaking}
          onSettingsOpen={() => setShowSettings(true)}
          handleLogout={handleLogout}
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

            {!token && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="auth-btn"
              >
                Login
              </button>
            )}
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
              pinChat={pinChat}
              setIsCreateNewChat={setIsCreateNewChat}
              highlightText={highlightText}
              setShowAuthModal={setShowAuthModal}
              token={token}
              user={user}
              chatsLoading={chatsLoading}
              deletingId={deletingId}
              setAttachedFile={setAttachedFile}
              setAttachedFileText={setAttachedFileText}
              setIsUploading={setIsUploading}
              stopSpeaking={stopSpeaking}
              onSettingsOpen={() => setShowSettings(true)}
              handleLogout={handleLogout}
            />
          </div>
        )}

        {!isMobile && (
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            {!token && (
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
            <h1 className="welcome-title">
              {isFirstLoad
                ? "What can I help with?"
                : "Start a New Conversation"}
            </h1>

            <p className="welcome-subtitle">
              {isFirstLoad
                ? "Ask anything, generate code, or explore AI."
                : "Upload a document or ask your first question."}
            </p>

            <div className="suggestions">
              {isFirstLoad ? (
                <>
                  <button onClick={() => setMessage("Explain React hooks")}>
                    Explain React hooks
                  </button>

                  <button onClick={() => setMessage("Write Fibonacci in JS")}>
                    Write Fibonacci in JS
                  </button>

                  <button onClick={() => setMessage("Create a blog on AI")}>
                    Create a blog on AI
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (token) {
                        document.getElementById("file-upload").click();
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                  >
                    Upload Document
                  </button>

                  <button onClick={() => setMessage("Summarize this PDF")}>
                    Summarize this PDF
                  </button>

                  <button
                    onClick={() => setMessage("What is this document about?")}
                  >
                    What is this document about?
                  </button>
                </>
              )}
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
                  {/* ── Image attachment ── */}
                  {msg.fileType?.includes("image") && (
                    <div
                      className="chat-image-wrap"
                      onClick={() => {
                        setPreviewFile(msg);
                        setShowPreviewModal(true);
                      }}
                    >
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName}
                        className="chat-image"
                      />
                      <div className="chat-image-overlay">
                        <Eye size={18} />
                        <span>View full image</span>
                      </div>
                    </div>
                  )}

                  {/* ── PDF / document attachment ── */}
                  {msg.fileName && !msg.fileType?.includes("image") && (
                    <div
                      className="msg-doc-chip"
                      onClick={() => {
                        setPreviewFile(msg);
                        setShowPreviewModal(true);
                      }}
                    >
                      <div className="msg-doc-icon">
                        <FileText size={20} color="white" />
                      </div>
                      <div className="msg-doc-info">
                        <span className="msg-doc-name">{msg.fileName}</span>
                        <span className="msg-doc-meta">Click to preview</span>
                      </div>
                      <Eye size={14} className="msg-doc-eye" />
                    </div>
                  )}

                  {/* ── Message text ── */}
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
                      {/* <span>Copied</span> */}
                    </span>
                  ) : (
                    <button
                      className="msg-action-btn"
                      title="Copy message"
                      onClick={() => handleCopy(msg.content, i)}
                    >
                      <Copy size={12} />
                      {/* <span>Copy</span> */}
                    </button>
                  )}

                  {/* Regenerate — only for last AI message */}
                  {msg.role === "assistant" &&
                    i === currentChat.messages.length - 1 && (
                      <button
                        className="msg-action-btn"
                        title="Regenerate response"
                        onClick={() => regenerateResponse(i)}
                        disabled={loading || isStreaming}
                      >
                        <RotateCcw size={12} />
                        {/* <span>Regenerate</span> */}
                      </button>
                    )}

                    {msg.role === "assistant" && (
                      <button
                        className={`msg-action-btn ${speakingMessageId === msg._id ? "voice-active" : ""}`}
                        onClick={() => toggleSpeech(msg._id, msg.content)}
                        title={speakingMessageId === msg._id ? "Stop Reading" : "Read Aloud"}
                      >
                        {speakingMessageId === msg._id ? <VolumeX size={18} /> : <Volume2 size={18} />}
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

            {/* ── Error message ── */}
            {chatError && (
              <div className="chat-error-wrap">
                <div className="chat-error">
                  <div className="chat-error-left">
                    <AlertCircle size={15} className="chat-error-icon" />
                    <span>{chatError}</span>
                  </div>
                  <div className="chat-error-actions">
                    <button
                      className="chat-error-retry"
                      onClick={() => {
                        setChatError(null);
                        sendMessage();
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Retry</span>
                    </button>
                    <button
                      className="chat-error-dismiss"
                      onClick={() => setChatError(null)}
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />

            {!isStreaming && currentChat?.messages.length > 0 && (
              <div className="message-actions">
                {copiedChat ? (
                  <button className="copied-chat-icon" title="Chat Copied">
                    <Check size={16} />
                  </button>
                ) : (
                  <button
                    className="copy-chat"
                    title="Copy Chat"
                    onClick={handleCopyChat}
                  >
                    <Copy size={16} />
                  </button>
                )}
                <button
                  className="export-chat"
                  title="Export Chat"
                  onClick={exportChat}
                >
                  <Download size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* {
          selectedImage && (
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="preview"
              className="preview-img"
            />
          )
        } */}

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
                <span
                  className="attached-file-name"
                  style={{
                    textDecoration: isUploading ? "none" : "underline",
                    cursor: isUploading ? "default" : "pointer",
                  }}
                  onClick={() => {
                    setPreviewFile({
                      fileName: attachedFile,
                      fileUrl: attachedFileUrl,
                      fileType: attachedFileType,
                    });

                    if (!isUploading) setShowPreviewModal(true);
                  }}
                >
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

            <button
              className={`mic-btn ${isListening ? "mic-recording" : ""}`}
              title={isListening ? "Listening..." : "Voice input"}
              disabled={loading || isUploading}
              onClick={startListening}
            >
              <Mic size={18} />
            </button>

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
                disabled={loading || isUploading || cooldown}
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

      {showPreviewModal && previewFile && (
        <div
          className="preview-overlay"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-preview"
              onClick={() => setShowPreviewModal(false)}
            >
              ✕
            </button>

            <h3>{previewFile.fileName}</h3>

            {previewFile.fileType?.includes("pdf") ? (
              <iframe
                src={previewFile.fileUrl}
                title="PDF Preview"
                className="preview-frame"
              />
            ) : previewFile.fileType?.includes("image") ? (
              <img
                src={previewFile.fileUrl}
                alt="Preview"
                className="preview-image"
              />
            ) : (
              <p>Preview not available for this file type.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <Settings
            onClose={() => setShowSettings(false)}
            token={token}
            settings={settings}
            setSettings={setSettings}
            voices={voices}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            handleVoiceChange={handleVoiceChange}
        />
      )}
    </div>
  );
}

export default App;
