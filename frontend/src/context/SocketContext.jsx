import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import API_BASE from "../config";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Get token from localStorage (or wherever you store it)
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        if (token) {
            // Socket.io connection logic
            // If API_BASE is http://localhost:3001, we use that.

            const socketUrl = API_BASE.replace(/\/api$/, ""); // Remove trailing /api if present

            const newSocket = io(socketUrl, {
                auth: {
                    token: token
                },
                transports: ["websocket"],
            });

            newSocket.on("connect", () => {
                // Socket connected successfully
            });

            newSocket.on("connect_error", (err) => {
                console.error("Socket connection error:", err.message);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
