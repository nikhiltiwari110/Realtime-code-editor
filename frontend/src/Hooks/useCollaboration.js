// useCollaboration.js - Custom hook for managing collaboration logic with proper state sync

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  setupSocketListeners, 
  joinRoom, 
  leaveRoom 
} from "../utils/socketHandler";
import { languageTemplates } from "../utils/editorConfig";

export const useCollaboration = (socket, roomId, username) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(languageTemplates["javascript"]);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  
  const isRemoteUpdate = useRef(false);
  const hasReceivedRoomState = useRef(false); // Track if we've received initial state

  useEffect(() => {
    if (!roomId || !username) {
      navigate("/");
      return;
    }

    // Join the room
    joinRoom(socket, roomId, username);

    // Setup socket listeners
    const cleanup = setupSocketListeners(socket, roomId, {
      // NEW: Handle initial room state when joining
      onRoomState: (roomState) => {
        console.log("📥 Received room state:", roomState);
        
        // Mark that we've received the room state
        hasReceivedRoomState.current = true;
        isRemoteUpdate.current = true;
        
        // Apply the complete room state
        setLanguage(roomState.language);
        setCode(roomState.code);
        setIsConsoleVisible(roomState.isConsoleVisible);
        setIsOutputOpen(roomState.isOutputOpen);
        
        // Reset the remote update flag after state is applied
        requestAnimationFrame(() => {
          isRemoteUpdate.current = false;
        });
        
        console.log("✅ Room state applied successfully");
      },
      
      onUsersUpdate: (roomUsers) => {
        setUsers(roomUsers);
        console.log(`👥 Users in room: ${roomUsers.length}`);
      },
      
      onUserJoined: (newUser) => {
        console.log(`✅ ${newUser.username} joined the room`);
      },
      
      onUserLeft: (id) => {
        console.log(`❌ User left: ${id}`);
      },
      
      onCodeUpdate: (newCode) => {
        // Only update if it's different and we're not the one who changed it
        if (code !== newCode && !isRemoteUpdate.current) {
          isRemoteUpdate.current = true;
          setCode(newCode);
          requestAnimationFrame(() => {
            isRemoteUpdate.current = false;
          });
        }
      },
      
      onLanguageUpdate: ({ language: newLang }) => {
        console.log(`🔄 Language changed to: ${newLang}`);
        isRemoteUpdate.current = true;
        setLanguage(newLang);
        setCode(languageTemplates[newLang]);
        requestAnimationFrame(() => {
          isRemoteUpdate.current = false;
        });
      },
      
      onCodeOutput: ({ output, error, runBy }) => {
        setIsRunning(false);
        setIsConsoleVisible(true);
        setIsOutputOpen(true);
        setConsoleOutput(
          error
            ? `❌ Error (by ${runBy}):\n${output}`
            : `👤 ${runBy} ran the code:\n\n${output}`
        );
      },
    });

    // Cleanup on unmount
    return () => {
      console.log("🚪 Leaving room:", roomId);
      leaveRoom(socket, roomId);
      cleanup();
      hasReceivedRoomState.current = false;
    };
  }, [roomId, username, navigate, socket]);

  return {
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
  };
};