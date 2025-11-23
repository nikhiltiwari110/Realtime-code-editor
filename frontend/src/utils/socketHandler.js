export const setupSocketListeners = (socket, roomId, callbacks) => {
  const {
    onUsersUpdate,
    onUserJoined,
    onUserLeft,
    onCodeUpdate,
    onLanguageUpdate,
    onCodeOutput,
  } = callbacks;

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

  // Cleanup function
  return () => {
    socket.off("all-users");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("code-update");
    socket.off("code-output");
    socket.off("language-update");
  };
};

/**
 * Join a room
 */
export const joinRoom = (socket, roomId, username) => {
  socket.emit("join-room", { roomId, username });
};

/**
 * Leave a room
 */
export const leaveRoom = (socket, roomId) => {
  socket.emit("leave-room", { roomId });
};

/**
 * Emit code change to other users
 */
export const emitCodeChange = (socket, roomId, code) => {
  socket.emit("code-change", { roomId, code });
};

/**
 * Emit language change to other users
 */
export const emitLanguageChange = (socket, roomId, language) => {
  socket.emit("language-update", { roomId, language });
  console.log("Language sent:", language);
};

/**
 * Run code on server
 */
export const runCode = (socket, roomId, code, language, username, input) => {
  socket.emit("run-code", { roomId, code, language, username, input });
};

// ===== COLLABORATIVE CONSOLE FUNCTIONS =====

/**
 * Emit console height change to other users
 */
export const emitConsoleHeight = (socket, roomId, height) => {
  socket.emit("console:height-change", { roomId, height });
};

/**
 * Emit console visibility toggle to other users
 */
export const emitConsoleVisibility = (socket, roomId, isVisible) => {
  socket.emit("console:visibility-change", { roomId, isVisible });
};

/**
 * Emit input panel visibility toggle to other users
 */
export const emitInputVisibility = (socket, roomId, isInputOpen) => {
  socket.emit("console:input-visibility-change", { roomId, isInputOpen });
};

/**
 * Emit output panel visibility toggle to other users
 */
export const emitOutputVisibility = (socket, roomId, isOutputOpen) => {
  socket.emit("console:output-visibility-change", { roomId, isOutputOpen });
};

/**
 * Listen for console height changes from other users
 */
export const onConsoleHeightChange = (socket, callback) => {
  socket.on("console:height-change", ({ height }) => {
    callback(height);
  });
};

/**
 * Listen for console visibility changes from other users
 */
export const onConsoleVisibilityChange = (socket, callback) => {
  socket.on("console:visibility-change", ({ isVisible }) => {
    callback(isVisible);
  });
};

/**
 * Listen for input panel visibility changes from other users
 */
export const onInputVisibilityChange = (socket, callback) => {
  socket.on("console:input-visibility-change", ({ isInputOpen }) => {
    callback(isInputOpen);
  });
};

/**
 * Listen for output panel visibility changes from other users
 */
export const onOutputVisibilityChange = (socket, callback) => {
  socket.on("console:output-visibility-change", ({ isOutputOpen }) => {
    callback(isOutputOpen);
  });
};

// ===== NEW: COLLABORATIVE INPUT FUNCTIONS =====

/**
 * Emit input change to other users
 */
export const emitInputChange = (socket, roomId, input) => {
  socket.emit("input:change", { roomId, input });
};

/**
 * Listen for input changes from other users
 */
export const onInputChange = (socket, callback) => {
  socket.on("input:change", ({ input }) => {
    callback(input);
  });
};