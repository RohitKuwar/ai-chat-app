import { useEffect, useRef } from 'react';
import { PanelLeft, Plus, MessageSquare, Trash2, Search, X } from 'lucide-react'

function Sidebar({ sidebarOpen, onToggle, createNewChat, search, setSearch, chats, currentChatId, setCurrentChatId, deleteChat, setIsCreateNewChat, highlightText }) {

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

  return (
    <div className={`sidebar-inner ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

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
          <button
            className="sb-strip-btn"
            onClick={onToggle}
            title="New chat"
          >
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
            title='Ctrl + K'
          />
          {search && (
            <X size={14} className="mob-sb-search-clear" onClick={() => setSearch('')} />
          )}
        </div>
      )}

      {/* ── Chat list (expanded only) ── */}
      {sidebarOpen && (
        <nav className="sb-nav">
          {
            chats.length === 0 ? (
              <div className="sb-no-chats">No chats found</div>
            ) : (
              chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
            onClick={() => {
              setIsCreateNewChat(false);
              setCurrentChatId(chat.id);
            }}
            title={chat.title}
          >
            <button
              key={chat.id}
              className={`sb-chat-item ${currentChatId === chat.id ? 'sb-chat-active' : ''}`}
              // onClick={() => setActiveId(chat.id)}
            >
              <MessageSquare size={13} className="sb-chat-icon" />
              <span className="sb-chat-title">{highlightText(chat.title, search)}</span>
              <Trash2
                size={14}
                className="sb-delete-btn"
                onClick={() => {
                  deleteChat(chat.id);
                }}
              />
            </button>
          </div>
        ))
            )
          }
        </nav>
      )}

      {/* ── Footer ── */}
      {/* <div className={`sb-footer ${!sidebarOpen ? 'sb-footer-center' : ''}`}>
        {sidebarOpen && (
          <>
            <button className="sb-footer-item">
              <User size={15} />
              <span>John Doe</span>
            </button>
            <button className="sb-footer-item">
              <Settings size={15} />
              <span>Settings</span>
            </button>
          </>
        )}
      </div> */}

    </div>
  )
}

export default Sidebar;