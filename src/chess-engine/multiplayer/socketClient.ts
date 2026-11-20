'use client';
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocketClient(url: string): Socket {
  if (!socket) {
    socket = io(url, {
      autoConnect: false,
      transports: ["websocket"]
    });
  }

  return socket;
}

