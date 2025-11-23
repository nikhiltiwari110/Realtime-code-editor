export const generateUserColor = (userId) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#67E6DC',
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const emitCursorPosition = (socket, roomId, position) => {
  if (!socket || !roomId || !position) return;
  
  socket.emit("cursor-position", {
    roomId,
    position: {
      lineNumber: position.lineNumber,
      column: position.column
    }
  });
};

export const setupCursorListener = (socket, callback) => {
  socket.on("cursor-update", callback);
  return () => socket.off("cursor-update");
};

// FIXED: Better coordinate calculation
export const getScreenCoordinates = (editor, position) => {
  if (!editor || !position) return null;
  
  try {
    const { lineNumber, column } = position;
    
    // Get the visible position of the cursor
    const coords = editor.getScrolledVisiblePosition({
      lineNumber,
      column,
    });
    
    if (!coords) return null;
    
    // Get editor container position
    const editorDom = editor.getDomNode();
    if (!editorDom) return null;
    
    const editorRect = editorDom.getBoundingClientRect();
    const contentWidget = editorDom.querySelector('.monaco-editor .overflow-guard');
    
    if (!contentWidget) {
      return {
        x: coords.left,
        y: coords.top,
      };
    }
    
    const contentRect = contentWidget.getBoundingClientRect();
    
    return {
      x: coords.left + (contentRect.left - editorRect.left),
      y: coords.top + (contentRect.top - editorRect.top),
    };
  } catch (error) {
    console.error('Error getting cursor coordinates:', error);
    return null;
  }
};

// FIXED: Better throttle function
export const throttle = (func, limit) => {
  let lastRan;
  let timeout;
  
  return function(...args) {
    const context = this;
    
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};