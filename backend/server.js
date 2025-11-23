import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import judge0Client from "./utils/judge0Client.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(express.json());

const rooms = {};

const languageMap = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    if (!roomId) return;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;

    if (!rooms[roomId]) rooms[roomId] = [];

    rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);
    rooms[roomId] = rooms[roomId].filter((u) => u.username !== username);

    rooms[roomId].push({ id: socket.id, username });

    io.to(roomId).emit("all-users", rooms[roomId]);
    socket.to(roomId).emit("user-joined", { id: socket.id, username });
    
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on("leave-room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    if (!rooms[roomId]) return;

    rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);
    socket.to(roomId).emit("user-left", socket.id);
    io.to(roomId).emit("all-users", rooms[roomId]);

    if (rooms[roomId].length === 0) delete rooms[roomId];
    
    console.log(`User left room ${roomId}`);
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("language-update", ({ roomId, language }) => {
    socket.to(roomId).emit("language-update", { language });
    const roomUsers = rooms[roomId] || [];
    if (roomUsers.length > 1) {
      console.log(`Language changed to ${language} in room ${roomId}`);
    }
  });

  // Cursor position tracking
  socket.on("cursor-position", ({ roomId, position }) => {
    const username = socket.data.username || "Unknown";
    
    socket.to(roomId).emit("cursor-update", {
      userId: socket.id,
      username: username,
      position,
    });
  });

  // NEW: Console height change - broadcast to all users in room
  socket.on("console:height-change", ({ roomId, height }) => {
    socket.to(roomId).emit("console:height-change", { height });
  });

  // NEW: Console visibility change - broadcast to all users in room
  socket.on("console:visibility-change", ({ roomId, isVisible }) => {
    socket.to(roomId).emit("console:visibility-change", { isVisible });
  });

  // NEW: Input panel visibility change - broadcast to all users in room
  socket.on("console:input-visibility-change", ({ roomId, isInputOpen }) => {
    socket.to(roomId).emit("console:input-visibility-change", { isInputOpen });
  });

  // NEW: Output panel visibility change - broadcast to all users in room
  socket.on("console:output-visibility-change", ({ roomId, isOutputOpen }) => {
    socket.to(roomId).emit("console:output-visibility-change", { isOutputOpen });
  });

  // NEW: Input field change - broadcast to all users in room
  socket.on("input:change", ({ roomId, input }) => {
    socket.to(roomId).emit("input:change", { input });
  });

  // Run code with rate limit handling
  socket.on("run-code", async ({ roomId, code, language, username, input }) => {
    try {
      const languageId = languageMap[language];
      if (!languageId) {
        io.to(roomId).emit("code-output", {
          output: `❌ Unsupported language: ${language}`,
          error: true,
          runBy: username,
        });
        return;
      }

      // Auto-wrap Java
      if (language === "java" && !/public\s+class\s+Main/.test(code)) {
        code = `public class Main {
  public static void main(String[] args) {
${code}
  }
}`;
      }

      // Auto-wrap C++
      if (language === "cpp" && !/int\s+main\s*\(/.test(code)) {
        code = `#include <iostream>
using namespace std;
int main() {
  ${code}
  return 0;
}`;
      }

      // Notify user that code execution is queued
      io.to(roomId).emit("code-output", {
        output: `⏳ Executing code (queued)...`,
        error: false,
        runBy: username,
      });

      // Use the judge0Client with rate limit handling
      const result = await judge0Client.executeCode({
        source_code: code,
        language_id: languageId,
        stdin: input || "",
      });

      io.to(roomId).emit("code-output", {
        output: result.stdout || result.stderr || result.compile_output || "⚠ No output",
        error: !!result.stderr || !!result.compile_output,
        runBy: username,
      });
    } catch (error) {
      console.error("Judge0 API Error:", error.response?.data || error.message);
      
      const errorMsg = error.response?.status === 429 
        ? "⚠ API rate limit exceeded. Please try again in a moment."
        : "⚠ Code execution failed. Try again later.";
      
      io.to(roomId).emit("code-output", {
        output: errorMsg,
        error: true,
        runBy: username,
      });
    }
  });

  // Optional: Add endpoint to check queue status
  socket.on("queue-status", () => {
    const status = judge0Client.getQueueStatus();
    socket.emit("queue-status", status);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    for (const roomId of Object.keys(rooms)) {
      const before = rooms[roomId].length;
      rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);
      if (rooms[roomId].length !== before) {
        socket.to(roomId).emit("user-left", socket.id);
        io.to(roomId).emit("all-users", rooms[roomId]);
      }
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});