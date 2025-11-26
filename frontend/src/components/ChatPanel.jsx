import React, { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import "../styles/ChatPanel.css";

const ChatPanel = ({ roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const emojis = ["😀", "😂", "🤔", "❤️", "👍", "🎉", "🚀", "💡", "🔥", "✨", "👌", "😎"];

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-expand textarea
  const autoExpandTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        100
      ) + "px";
    }
  };

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = ({ username: msgUsername, message, timestamp, isAI }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          username: msgUsername,
          message,
          timestamp: timestamp || new Date(),
          isAI: isAI || false,
          isOwn: msgUsername === username,
        },
      ]);
      setTypingUsers((prev) => prev.filter((u) => u !== msgUsername));
    };

    const handleAIResponse = (reply) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          username: "AI Assistant",
          message: reply,
          timestamp: new Date(),
          isAI: true,
          isOwn: false,
        },
      ]);
      setIsLoading(false);
    };

    const handleUserTyping = ({ username: typingUsername, isTyping: typing }) => {
      if (typing && typingUsername !== username) {
        setTypingUsers((prev) =>
          prev.includes(typingUsername) ? prev : [...prev, typingUsername]
        );
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== typingUsername));
      }
    };

    socket.on("chatMessage", handleChatMessage);
    socket.on("aiResponse", handleAIResponse);
    socket.on("user:typing", handleUserTyping);

    return () => {
      socket.off("chatMessage", handleChatMessage);
      socket.off("aiResponse", handleAIResponse);
      socket.off("user:typing", handleUserTyping);
    };
  }, [socket, username]);

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message || !socket) return;

    socket.emit("chatMessage", {
      roomId,
      username,
      message,
      timestamp: new Date(),
    });

    setInputValue("");
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("user:typing", { roomId, username, isTyping: false });
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleAskAI = () => {
    const prompt = inputValue.trim();
    if (!prompt || !socket) return;

    setIsLoading(true);
    socket.emit("askAI", {
      roomId,
      username,
      prompt,
    });

    setInputValue("");
    setIsTyping(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    autoExpandTextarea();

    // Notify typing
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      socket?.emit("user:typing", { roomId, username, isTyping: true });
    }

    // Debounce typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("user:typing", { roomId, username, isTyping: false });
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-title-section">
          <span className="chat-icon">💬</span>
          <h3>Live Chat</h3>
          <span className="chat-badge">{messages.length}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <span className="empty-icon">👋</span>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.isOwn ? "own" : ""} ${
                msg.isAI ? "ai" : ""
              }`}
            >
              <div className="message-avatar">
                {msg.isAI ? (
                  <span className="ai-avatar">🤖</span>
                ) : (
                  <span className="user-avatar">
                    {msg.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-text">{msg.message}</div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-avatar">✏️</span>
            <span className="typing-text">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
              typing
            </span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <div className="input-actions">
            <button
              className="action-btn emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
              aria-label="Add emoji"
            >
              😊
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isMobile ? "Message..." : "Type a message... (Shift+Enter for new line)"}
            rows="1"
            disabled={isLoading}
            style={{ overflow: "hidden" }}
          />

          <div className="input-buttons">
            <button
              className="action-btn send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              title="Send message"
              aria-label="Send message"
            >
              ✈️
            </button>
            <button
              className="action-btn ai-btn"
              onClick={handleAskAI}
              disabled={!inputValue.trim() || isLoading}
              title="Ask AI Assistant"
              aria-label="Ask AI Assistant"
            >
              {isLoading ? "⏳" : "🤖"}
            </button>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() => addEmoji(emoji)}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
