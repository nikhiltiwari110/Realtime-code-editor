// ===== SOCKET LISTENERS =====
export const setupSocketListeners = (socket, roomId, callbacks) => {
  const {
    onRoomState,
    onUsersUpdate,
    onUserJoined,
    onUserLeft,
    onCodeUpdate,
    onLanguageUpdate,
    onCodeOutput,
  } = callbacks;

  // NEW: Listen for initial room state when joining
  socket.on("room-state", onRoomState);

  // User management
  socket.on("all-users", onUsersUpdate);
  socket.on("user-joined", onUserJoined);
  socket.on("user-left", onUserLeft);

  // Code synchronization
  socket.on("code-update", onCodeUpdate);

  // Language change
  socket.on("language-update", onLanguageUpdate);

  // Code execution results
  socket.on("code-output", onCodeOutput);

  // Cleanup
  return () => {
    socket.off("room-state");
    socket.off("all-users");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("code-update");
    socket.off("code-output");
    socket.off("language-update");
  };
};

// ===== ROOM JOIN/LEAVE =====
export const joinRoom = (socket, roomId, username) => {
  socket.emit("join-room", { roomId, username });
  window.currentRoomId = roomId;
  window.currentUsername = username;
};

export const leaveRoom = (socket, roomId) => {
  socket.emit("leave-room", { roomId });
};

// ===== CODE SYNC =====
export const emitCodeChange = (socket, roomId, code) => {
  socket.emit("code-change", { roomId, code });
};

export const emitLanguageChange = (socket, roomId, language) => {
  socket.emit("language-update", { roomId, language });
};

// ===== RUN CODE =====
export const runCode = (socket, roomId, code, language, username, input) => {
  socket.emit("run-code", { roomId, code, language, username, input });
};

// ===== CONSOLE SYNC =====
export const emitConsoleHeight = (socket, roomId, height) => {
  socket.emit("console:height-change", { roomId, height });
};

export const emitConsoleVisibility = (socket, roomId, isVisible) => {
  socket.emit("console:visibility-change", { roomId, isVisible });
};

export const emitInputVisibility = (socket, roomId, isInputOpen) => {
  socket.emit("console:input-visibility-change", { roomId, isInputOpen });
};

export const emitOutputVisibility = (socket, roomId, isOutputOpen) => {
  socket.emit("console:output-visibility-change", { roomId, isOutputOpen });
};

export const onConsoleHeightChange = (socket, callback) => {
  socket.on("console:height-change", ({ height }) => callback(height));
};

export const onConsoleVisibilityChange = (socket, callback) => {
  socket.on("console:visibility-change", ({ isVisible }) => callback(isVisible));
};

export const onInputVisibilityChange = (socket, callback) => {
  socket.on("console:input-visibility-change", ({ isInputOpen }) => callback(isInputOpen));
};

export const onOutputVisibilityChange = (socket, callback) => {
  socket.on("console:output-visibility-change", ({ isOutputOpen }) => callback(isOutputOpen));
};

// ===== NEW: COLLABORATIVE INPUT FUNCTIONS =====

/**
 * Emit input change to other users
 */
export const emitInputChange = (socket, roomId, input) => {
  socket.emit("input:change", { roomId, input });
};

export const onInputChange = (socket, callback) => {
  socket.on("input:change", ({ input }) => callback(input));
};

// ===== 💬 CHAT INTEGRATION (Realtime) =====
// Modern chat integration handled via ChatPanel React component
// This function is kept for backward compatibility if needed
export const initChat = (socket) => {
  // Chat is now managed by the ChatPanel React component
  // This function is maintained for compatibility but not used
  console.log("Chat initialized via ChatPanel component");
};
