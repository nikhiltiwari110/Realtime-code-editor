import { io } from "socket.io-client";

export const socket = io("https://realtime-code-editor-c8ja.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});
