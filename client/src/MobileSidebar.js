import React from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react'

function MobileSidebar({ mobSidebarOpen, setMobSidebarOpen, onToggle, createNewChat, chats, currentChatId, setCurrentChatId, deleteChat, setIsCreateNewChat }) {
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

        <nav className="sb-nav">
          {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
            onClick={() => {
              setIsCreateNewChat(false);
              setCurrentChatId(chat.id);
              setMobSidebarOpen(false);
            }}
            title={chat.title}
          >
            <button
              key={chat.id}
              className={`sb-chat-item ${currentChatId === chat.id ? 'sb-chat-active' : ''}`}
              // onClick={() => setActiveId(chat.id)}
            >
              <MessageSquare size={13} className="sb-chat-icon" />
              <span className="sb-chat-title">{chat.title}</span>
              <Trash2
                size={14}
                onClick={() => {
                  deleteChat(chat.id);
                }}
              />
            </button>
          </div>
        ))}
        </nav>
    </div>
  )
}

export default MobileSidebar;