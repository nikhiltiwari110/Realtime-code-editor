import React, { useState, useEffect, useRef } from "react";
import { generateUserColor, getScreenCoordinates } from "../utils/cursorTracker";
import "../styles/cursor.css";

const RemoteCursor = ({ userId, username, position, editorRef }) => {
  const [coords, setCoords] = useState(null);
  const color = generateUserColor(userId);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !position) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      // Clear any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      updateTimeoutRef.current = requestAnimationFrame(() => {
        const screenCoords = getScreenCoordinates(editorRef.current, position);
        if (screenCoords) {
          setCoords(screenCoords);
        }
      });
    };

    updatePosition();

    // Listen to editor events for position updates
    const editor = editorRef.current;
    const scrollListener = editor.onDidScrollChange(updatePosition);
    const layoutListener = editor.onDidLayoutChange(updatePosition);
    const contentListener = editor.onDidChangeModelContent(updatePosition);

    return () => {
      if (updateTimeoutRef.current) {
        cancelAnimationFrame(updateTimeoutRef.current);
      }
      scrollListener.dispose();
      layoutListener.dispose();
      contentListener.dispose();
    };
  }, [position, editorRef]);

  if (!coords) return null;

  return (
    <div
      className="remote-cursor"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        borderLeftColor: color,
      }}
    >
      <div
        className="cursor-flag"
        style={{ backgroundColor: color }}
      >
        {username}
      </div>
    </div>
  );
};

const CursorOverlay = ({ cursors, editorRef }) => {
  return (
    <div className="cursor-overlay">
      {Object.entries(cursors).map(([userId, data]) => (
        <RemoteCursor
          key={userId}
          userId={userId}
          username={data.username}
          position={data.position}
          editorRef={editorRef}
        />
      ))}
    </div>
  );
};

export default CursorOverlay;