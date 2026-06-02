import { useState, useEffect, useRef } from 'react';
import { PanelLeft, Plus, MessageSquare, Trash2, Search, X, Pencil, User, Loader2, Pin, PinOff, Settings, LogOut } from 'lucide-react'
import { getInitials } from './Utils/getInitials';

function Sidebar({ sidebarOpen, onToggle, createNewChat, search, setSearch, chats, currentChatId, setCurrentChatId, deleteChat, renameChat, pinChat, setIsCreateNewChat, highlightText, setShowAuthModal, token, user, chatsLoading, deletingId, setAttachedFile, setAttachedFileText, setIsUploading, stopSpeaking, onSettingsOpen, handleLogout }) {

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userMenuRef.current && !userMenuRef.current.contains(e.target) &&
        footerRef.current && !footerRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            chats?.sort((a, b) => b.isPinned - a.isPinned)?.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
                onClick={() => {
                  setIsCreateNewChat(false);
                  setCurrentChatId(chat.id);
                  setAttachedFile(null);
                  setAttachedFileText("");
                  setIsUploading(false);
                  setUserMenuOpen(false);
                }}
                title={chat.title}
              >
                <button
                  key={chat.id}
                  className={`sb-chat-item ${currentChatId === chat.id ? "sb-chat-active" : ""}`}
                  // onClick={() => setActiveId(chat.id)}
                  onClick={() => {
                    stopSpeaking();
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
                        <button
                          className="sb-rename-btn"
                          title={`${chat.isPinned ? "Unpin chat" : "Pin chat"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            pinChat(chat.id);
                          }}
                        >
                          {chat.isPinned ? <PinOff size={14} fill='#ddd' /> : <Pin size={14} />}
                        </button>
                      )}
                      {token && (
                        <button
                          className="sb-rename-btn"
                          title="Rename"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(chat.id);
                            setEditTitle(chat.title);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {
                        deletingId === chat.id ? (
                          <Loader2 size={13} className="sb-deleting-icon" />
                        ) : (
                          <button
                            className="sb-delete-btn"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {
        token && (
          <div>
            {
              userMenuOpen && (
                <div className="sb-user-menu" ref={userMenuRef}>
                  <button
                  className="sb-context-item"
                  onClick={() => { 
                    stopSpeaking();
                    setUserMenuOpen(false); 
                    onSettingsOpen(); 
                  }}
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <div className="sb-context-divider" />
                <button
                  className="sb-context-item sb-context-delete"
                  onClick={() => { 
                    setUserMenuOpen(false); 
                    handleLogout(); 
                  }}
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
                </div>
              )
            }
          </div>
        )
      }

      {/* ── Footer ── */}
      <div className={`sb-footer ${!sidebarOpen ? "sb-footer-center" : ""}`} ref={footerRef} onClick={() => setUserMenuOpen(prev => !prev)}>
        {sidebarOpen && (
          <div className="sb-footer-box">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;