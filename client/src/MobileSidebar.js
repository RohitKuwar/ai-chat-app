import React from 'react';
import { Plus, MessageSquare, Trash2, Search, X } from 'lucide-react'
import { getInitials } from './Utils/getInitials';

function MobileSidebar({ mobSidebarOpen, setMobSidebarOpen, onToggle, search, setSearch, createNewChat, chats, currentChatId, setCurrentChatId, deleteChat, setIsCreateNewChat, highlightText, setShowAuthModal, token, user }) {
  return (
    <div className={`mobile-sidebar ${mobSidebarOpen ? "visible" : "hidden"}`}>
        <div className="sb-new-chat-wrap">
          <button className="sb-new-chat" onClick={() => {
            createNewChat();
            setMobSidebarOpen(false);
          }}>
            <Plus size={15} />
            <span>New chat</span>
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="mob-sb-search" onClick={(e) => e.stopPropagation()}>
          <Search size={14} className="mob-sb-search-icon" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mob-sb-search-input"
          />
          {search && (
            <X size={14} className="mob-sb-search-clear" onClick={() => setSearch('')} />
          )}
        </div>

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
              setMobSidebarOpen(false);
              setSearch("");
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              />
            </button>
          </div>
        ))
            )
          }
        </nav>

      {/* ── Footer ── */}
      <div className="mob-sb-footer" style={{ marginTop: "auto" }}>
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
    </div>
  )
}

export default MobileSidebar;