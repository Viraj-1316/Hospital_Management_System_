const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");
const logger = require("./logger");

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
                : "*", // Fallback to * or specific env var
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error("Socket Auth Failed: No token provided");
            return next(new Error("Authentication error: No token provided"));
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("Socket Auth Failed: Invalid token", err.message);
                return next(new Error("Authentication error: Invalid token"));
            }
            socket.user = decoded;
            next();
        });
    });

    io.on("connection", (socket) => {
        logger.info(`User connected: ${socket.user.id} (${socket.user.role})`);

        // Join room based on user ID and Role
        socket.join(socket.user.id);
        socket.join(`role:${socket.user.role}`);

        if (socket.user.role === "admin") {
            socket.join("admin-room");
        }

        socket.on("disconnect", () => {
            logger.info(`User disconnected: ${socket.user.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

// Helper to emit events to specific users or roles
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

const emitToRole = (role, event, data) => {
    if (io) {
        io.to(`role:${role}`).emit(event, data);
    }
};

const emitToAdmin = (event, data) => {
    if (io) {
        io.to("admin-room").emit(event, data);
    }
};

module.exports = {
    initSocket,
    getIo,
    emitToUser,
    emitToRole,
    emitToAdmin
};
