import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";
import ChatPanel from "./ChatPanel";
import { formatCode, getFormattingMessage } from "../utils/codeFormatter";
import { 
  emitCodeChange, 
  emitLanguageChange, 
  runCode as executeCode,
  leaveRoom,
  emitConsoleHeight,
  emitConsoleVisibility,
  emitInputVisibility,
  emitOutputVisibility,
  onConsoleHeightChange,
  onConsoleVisibilityChange,
  onInputVisibilityChange,
  onOutputVisibilityChange,
  emitInputChange,
  onInputChange
} from "../utils/socketHandler";
import { 
  languageTemplates, 
  defineCustomTheme, 
  editorOptions 
} from "../utils/editorConfig";
import { 
  emitCursorPosition, 
  setupCursorListener, 
  throttle 
} from "../utils/cursorTracker";
import { useCollaboration } from "../hooks/useCollaboration";
import ConsoleManager from "../components/ConsoleManager";
import CursorOverlay from "../components/CursorOverlay";
import "../styles/Editor.css";

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const CodeEditor = ({ roomId, username }) => {
  const navigate = useNavigate();
  
  const {
    users,
    language,
    setLanguage,
    code,
    setCode,
    consoleOutput,
    setConsoleOutput,
    isRunning,
    setIsRunning,
    isConsoleVisible,
    setIsConsoleVisible,
    isOutputOpen,
    setIsOutputOpen,
    isRemoteUpdate,
  } = useCollaboration(socket, roomId, username);

  const [input, setInput] = useState("");
  const [isInputOpen, setIsInputOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [syncStatus, setSyncStatus] = useState("connected");
  const [lastSaveTime, setLastSaveTime] = useState(new Date());
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  const editorRef = useRef(null);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const isRemoteConsoleUpdate = useRef(false);
  const isRemoteInputUpdate = useRef(false);

  const debouncedEmit = useRef(
    debounce((value) => {
      if (!isRemoteUpdate.current) {
        emitCodeChange(socket, roomId, value);
        setLastSaveTime(new Date());
        setSyncStatus("syncing");
        setTimeout(() => setSyncStatus("connected"), 500);
      }
    }, 300)
  ).current;

  const debouncedConsoleHeight = useRef(
    debounce((height) => {
      if (!isRemoteConsoleUpdate.current) {
        emitConsoleHeight(socket, roomId, height);
      }
    }, 200)
  ).current;

  const debouncedInputEmit = useRef(
    debounce((value) => {
      if (!isRemoteInputUpdate.current) {
        emitInputChange(socket, roomId, value);
      }
    }, 200)
  ).current;

  // Show notification
  const showToast = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Monitor user changes
  useEffect(() => {
    const prevUserCount = users.length;
    if (users.length > prevUserCount) {
      const newUser = users[users.length - 1];
      showToast(`${newUser.username} joined the session`);
    }
  }, [users]);

  // Handle console resizing
  const handleMouseDown = (e) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = consoleHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const deltaY = startY.current - e.clientY;
      const newHeight = Math.min(Math.max(startHeight.current + deltaY, 150), 600);
      setConsoleHeight(newHeight);
      debouncedConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [consoleHeight, debouncedConsoleHeight]);

  // Listen for all console changes
  useEffect(() => {
    if (!socket) return;

    onConsoleHeightChange(socket, (height) => {
      isRemoteConsoleUpdate.current = true;
      setConsoleHeight(height);
      requestAnimationFrame(() => {
        isRemoteConsoleUpdate.current = false;
      });
    });

    onConsoleVisibilityChange(socket, (isVisible) => {
      setIsConsoleVisible(isVisible);
    });

    onInputVisibilityChange(socket, (isInputOpen) => {
      setIsInputOpen(isInputOpen);
    });

    onOutputVisibilityChange(socket, (isOutputOpen) => {
      setIsOutputOpen(isOutputOpen);
    });

    onInputChange(socket, (remoteInput) => {
      isRemoteInputUpdate.current = true;
      setInput(remoteInput);
      requestAnimationFrame(() => {
        isRemoteInputUpdate.current = false;
      });
    });
  }, [socket]);

  const handleCodeChange = (value) => {
    setCode(value);
    if (!isRemoteUpdate.current) {
      debouncedEmit(value);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    defineCustomTheme(monaco);

    editor.onDidCompositionStart(() => {
      isRemoteUpdate.current = true;
    });

    editor.onDidCompositionEnd(() => {
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 100);
    });

    const throttledCursorEmit = throttle((position) => {
      if (position && position.lineNumber && position.column) {
        emitCursorPosition(socket, roomId, position);
      }
    }, 100);

    editor.onDidChangeCursorPosition((e) => {
      if (e.position) {
        throttledCursorEmit(e.position);
      }
    });
  };

  useEffect(() => {
    if (!socket) return;

    const cursorTimeouts = new Map();
    const CURSOR_TIMEOUT = 8000;

    const cleanup = setupCursorListener(socket, ({ userId, username: remoteUsername, position }) => {
      if (!userId || userId === socket.id || remoteUsername === username) {
        return;
      }

      if (!position || !position.lineNumber || !position.column) {
        return;
      }

      if (cursorTimeouts.has(userId)) {
        clearTimeout(cursorTimeouts.get(userId));
      }

      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { 
          username: remoteUsername, 
          position: {
            lineNumber: position.lineNumber,
            column: position.column
          }
        },
      }));

      const timeout = setTimeout(() => {
        setRemoteCursors((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        cursorTimeouts.delete(userId);
      }, CURSOR_TIMEOUT);

      cursorTimeouts.set(userId, timeout);
    });

    return () => {
      cleanup();
      cursorTimeouts.forEach((timeout) => clearTimeout(timeout));
      cursorTimeouts.clear();
    };
  }, [socket, username]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(languageTemplates[newLang]);
    emitLanguageChange(socket, roomId, newLang);
    showToast(`Switched to ${newLang}`);
  };

  const handleFormatCode = () => {
    const formatted = formatCode(code, language);
    setCode(formatted);
    emitCodeChange(socket, roomId, formatted);
    showToast("Code formatted successfully!");
    
    const originalOutput = consoleOutput;
    setConsoleOutput(getFormattingMessage(language));
    setTimeout(() => {
      setConsoleOutput(originalOutput);
    }, 2000);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput("⏳ Running code...");
    executeCode(socket, roomId, code, language, username, input);
    showToast("Executing code...");
  };

  const handleLeaveRoom = () => {
    leaveRoom(socket, roomId);
    navigate("/");
  };

  const handleToggleConsole = () => {
    const newState = !isConsoleVisible;
    setIsConsoleVisible(newState);
    emitConsoleVisibility(socket, roomId, newState);
  };

  const handleToggleInput = () => {
    const newState = !isInputOpen;
    setIsInputOpen(newState);
    emitInputVisibility(socket, roomId, newState);
  };

  const handleToggleOutput = () => {
    const newState = !isOutputOpen;
    setIsOutputOpen(newState);
    emitOutputVisibility(socket, roomId, newState);
  };

  const handleInputChange = (value) => {
    setInput(value);
    debouncedInputEmit(value);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    showToast("Room ID copied to clipboard!");
  };

  const getLanguageIcon = (lang) => {
    const icons = {
      javascript: "🟨",
      python: "🐍",
      cpp: "⚙️",
      java: "☕"
    };
    return icons[lang] || "💻";
  };

  return (
    <div className={`editor-container ${!isChatOpen ? 'chat-hidden' : ''}`}>
      {/* Animated Background Elements */}
      <div className="editor-bg-orb orb-1"></div>
      <div className="editor-bg-orb orb-2"></div>
      <div className="grid-overlay"></div>

      {/* Toast Notification */}
      {showNotification && (
        <div className="toast-notification">
          <div className="toast-icon">✓</div>
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <div className="brand-badge">
            <span className="brand-icon">💻</span>
            <span className="brand-text">CodeSync</span>
          </div>
          <div className="room-badge" onClick={handleCopyRoomId}>
            <span className="room-label">Room</span>
            <span className="room-id-text">{roomId}</span>
            <span className="copy-hint">📋</span>
          </div>
        </div>

        <div className="header-right">
          <div className="sync-status">
            <span className={`sync-dot ${syncStatus}`}></span>
            <span className="sync-text">
              {syncStatus === "connected" ? "Synced" : "Syncing..."}
            </span>
          </div>
          <div className="user-badge">
            <span className="user-icon">👤</span>
            <span className="user-name">{username}</span>
          </div>
          <button className="leave-btn" onClick={handleLeaveRoom}>
            <span className="leave-icon">🚪</span>
            <span>Leave</span>
          </button>
        </div>
      </div>



      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <div className="language-selector-wrapper">
            <span className="language-icon">{getLanguageIcon(language)}</span>
            <select
              className="language-selector"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <button className="toolbar-btn format-btn" onClick={handleFormatCode}>
            <span className="btn-icon">✨</span>
            <span>Format</span>
          </button>
          <button 
            className="toolbar-btn run-btn" 
            onClick={handleRunCode} 
            disabled={isRunning}
          >
            <span className="btn-icon">{isRunning ? "⏳" : "▶"}</span>
            <span>{isRunning ? "Running" : "Run"}</span>
          </button>
        </div>

        <div className="toolbar-right">
          <div className="last-saved">
            <span className="save-icon">💾</span>
            <span>Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar - Users */}
        <div className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-icon">👥</span>
            <span className="sidebar-title">Collaborators</span>
            <span className="user-count">{users.length}</span>
          </div>
          <div className="users-list">
            {users.map((u, index) => (
              <div key={u.id} className="user-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="user-avatar">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name-text">{u.username}</span>
                  <span className="user-status-text">
                    <span className="status-dot-active"></span>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="action-header">Quick Actions</div>
            <button className="action-btn" onClick={handleToggleConsole}>
              <span>🖥️</span>
              <span>{isConsoleVisible ? "Hide" : "Show"} Console</span>
            </button>
            <button className="action-btn" onClick={handleCopyRoomId}>
              <span>📋</span>
              <span>Copy Room ID</span>
            </button>
          </div>
        </div>
        {/* ========= MODERN CHAT PANEL ========= */}
        <ChatPanel roomId={roomId} username={username} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />


        {/* Editor Section */}
        <div className="editor-section">
          <div className="editor-wrapper" style={{ position: 'relative' }}>
            <div className="editor-glow-border"></div>
            <Editor
              height="100%"
              language={language}
              theme="custom-dark"
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={editorOptions}
            />
            <CursorOverlay cursors={remoteCursors} editorRef={editorRef} />
          </div>

          <ConsoleManager
            isConsoleVisible={isConsoleVisible}
            setIsConsoleVisible={handleToggleConsole}
            consoleHeight={consoleHeight}
            handleMouseDown={handleMouseDown}
            isInputOpen={isInputOpen}
            setIsInputOpen={handleToggleInput}
            input={input}
            setInput={handleInputChange}
            isOutputOpen={isOutputOpen}
            setIsOutputOpen={handleToggleOutput}
            consoleOutput={consoleOutput}
            setConsoleOutput={setConsoleOutput}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-item">
            <span className="status-icon">⚡</span>
            <span>Lines: {code.split('\n').length}</span>
          </span>
          <span className="status-item">
            <span className="status-icon">📝</span>
            <span>Chars: {code.length}</span>
          </span>
        </div>
        <div className="status-right">
          <span className="status-item">
            <span className="status-icon">🔒</span>
            <span>Encrypted</span>
          </span>
          <span className="status-item">
            <span className="status-icon">🌐</span>
            <span>Real-time Sync</span>
          </span>
        </div>
      </div>
    </div>
    
  );
};


export default CodeEditor;