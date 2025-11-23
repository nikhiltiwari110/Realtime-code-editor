// useCollaboration.js - Custom hook for managing collaboration logic

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

  useEffect(() => {
    if (!roomId || !username) {
      navigate("/");
      return;
    }

    // Join the room
    joinRoom(socket, roomId, username);

    // Setup socket listeners
    const cleanup = setupSocketListeners(socket, roomId, {
      onUsersUpdate: (roomUsers) => setUsers(roomUsers),
      
      onUserJoined: (newUser) => {
        console.log(`${newUser.username} joined`);
      },
      
      onUserLeft: (id) => {
        console.log(`User left: ${id}`);
      },
      
      onCodeUpdate: (newCode) => {
        if (code !== newCode) {
          isRemoteUpdate.current = true;
          setCode(newCode);
          requestAnimationFrame(() => {
            isRemoteUpdate.current = false;
          });
        }
      },
      
      onLanguageUpdate: ({ language: newLang }) => {
        setLanguage(newLang);
        setCode(languageTemplates[newLang]);
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
      leaveRoom(socket, roomId);
      cleanup();
    };
  }, [roomId, username, navigate]);

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