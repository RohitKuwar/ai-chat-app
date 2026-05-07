import { useState, useEffect, useRef } from 'react';
import { PanelLeft, Plus, MessageSquare, Trash2, Search, X, Pencil, User, Loader2 } from 'lucide-react'
import { getInitials } from './Utils/getInitials';

function Sidebar({ sidebarOpen, onToggle, createNewChat, search, setSearch, chats, currentChatId, setCurrentChatId, deleteChat, renameChat, setIsCreateNewChat, highlightText, setShowAuthModal, token, user, chatsLoading, deletingId, setAttachedFile, setAttachedFileText, setIsUploading }) {

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");

      if (
        (isMac && e.metaKey && e.key === "k") || 
        (!isMac && e.ctrlKey && e.key === "k")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleSaveEdit = (chatId) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    renameChat(chatId, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div
      className={`sidebar-inner ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}
    >
      {/* ── Top: logo + toggle ── */}
      <div className="sb-header">
        {sidebarOpen && <span className="sb-logo">AI Chat Studio</span>}
        <button className="sb-toggle" onClick={onToggle} title="Toggle sidebar">
          <PanelLeft size={18} />
        </button>
      </div>

      {/* ── Collapsed icon strip ── */}
      {!sidebarOpen && (
        <div className="sb-icon-strip">
          {/* Plus — click to expand */}
          <button className="sb-strip-btn" onClick={onToggle} title="New chat">
            <Plus size={17} />
          </button>

          {/* Search — click to expand */}
          <button
            className="sb-strip-btn"
            onClick={onToggle}
            title="Search chats"
          >
            <Search size={17} />
          </button>

          {/* Chat history — click to expand */}
          <button
            className="sb-strip-btn"
            onClick={onToggle}
            title="Chat history"
          >
            <MessageSquare size={17} />
          </button>
          {token ? (
            <span
              className="sb-footer-avatar"
              style={{ marginTop: "auto", marginBottom: "0px" }}
            >
              {getInitials(user.name)}
            </span>
          ) : (
            <span
              className="sb-footer-avatar"
              style={{ marginTop: "auto", marginBottom: "0px", cursor: "pointer" }}
              onClick={() => setShowAuthModal(true)}
            >
              <User size={18} />
            </span>
          )}
        </div>
      )}

      {/* ── New Chat button (expanded only) ── */}
      {sidebarOpen && (
        <div className="sb-new-chat-wrap">
          <button className="sb-new-chat" onClick={createNewChat}>
            <Plus size={15} />
            <span>New chat</span>
          </button>
        </div>
      )}

      {/* ── Search bar (expanded only) ── */}
      {sidebarOpen && (
        <div className="sb-search">
          <Search size={14} className="sb-search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sb-search-input"
            title="Ctrl + K"
          />
          {search && (
            <X
              size={14}
              className="mob-sb-search-clear"
              onClick={() => setSearch("")}
            />
          )}
        </div>
      )}

      {/* ── Chat list (expanded only) ── */}
      {sidebarOpen && (
        <nav className="sb-nav">
          {chatsLoading ? (
            token && (
            <div className="sb-loader">
              <Loader2 size={16} className="sb-loader-icon" />
              <span>Loading chats...</span>
            </div>
            )
          ) :
          chats.length === 0 ? (
            <div className="sb-no-chats">No chats found</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
                onClick={() => {
                  setIsCreateNewChat(false);
                  setCurrentChatId(chat.id);
                  setAttachedFile(null);
                  setAttachedFileText("");
                  setIsUploading(false);
                }}
                title={chat.title}
              >
                <button
                  key={chat.id}
                  className={`sb-chat-item ${currentChatId === chat.id ? "sb-chat-active" : ""}`}
                  // onClick={() => setActiveId(chat.id)}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setIsCreateNewChat(false);
                  }}
                >
                  <MessageSquare size={13} className="sb-chat-icon" />
                  {editingId === chat.id ? (
                    <input
                      className="sb-edit-input"
                      value={editTitle}
                      autoFocus
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(chat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => handleSaveEdit(chat.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="sb-chat-title">
                      {highlightText(chat.title, search)}
                    </span>
                  )}
                  {chat.messages.length > 0 && (
                    <div className="sb-chat-actions">
                      {token && (
                        <Pencil
                          size={14}
                          className="sb-rename-btn"
                          title="Rename"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(chat.id);
                            setEditTitle(chat.title);
                          }}
                        />
                      )}
                      {
                        deletingId === chat.id ? (
                          <Loader2 size={13} className="sb-deleting-icon" />
                        ) : (
                          <Trash2
                            size={14}
                            className="sb-delete-btn"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                          />
                        )
                      }
                    </div>
                  )}
                </button>
              </div>
            ))
          )}
        </nav>
      )}

      {/* ── Footer ── */}
      <div className={`sb-footer ${!sidebarOpen ? "sb-footer-center" : ""}`}>
        {sidebarOpen && (
          <div style={{ color: "white" }}>
            {token ? (
              <div className="sb-footer-user">
                <span className="sb-footer-avatar">
                  {getInitials(user.name)}
                </span>
                <span className="sb-footer-username" title={user.name}>{user.name}</span>
              </div>
            ) : (
              <div className="sb-login-cta">
                <p>Save your chats & unlock more</p>
                <button
                  className="sb-footer-login-btn"
                  onClick={() => setShowAuthModal(true)}
                >
                  Log in
                </button>
              </div>
            )}
            {/* <button className="sb-footer-item">
              <User size={15} />
              <span>John Doe</span>
            </button> */}
            {/* <button className="sb-footer-item">
              <Settings size={15} />
              <span>Settings</span>
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;