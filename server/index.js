const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// Configure allowed origins
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://saath-write.vercel.app/", // Your deployed frontend (update this)
  "https://saathwrite.onrender.com" // Your backend itself
];

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || 
        origin.startsWith("https://saathwrite-") || // For Vercel preview URLs
        origin.includes("localhost")) { // Additional localhost variations
      return callback(null, true);
    }
    
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests
app.options("*", cors());

const server = http.createServer(app);

// Socket.IO with enhanced CORS
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "SaathWrite Backend Service",
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
let rooms = [];

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Join Room
  socket.on("joinRoom", (data) => {
    const { roomId, userName } = data;
    console.log(`User ${userName} joining room ${roomId}`);
    
    socket.join(roomId);
    
    const room = rooms.find(r => r.roomId === roomId);
    if (room) {
      io.to(socket.id).emit("updateCanvas", room);
      room.users.push({ socketId: socket.id, userName });
    } else {
      rooms.push({
        roomId,
        elements: [],
        users: [{ socketId: socket.id, userName }],
        canvasColor: "#121212"
      });
    }
  });

  // Canvas updates
  socket.on("updateCanvas", (data) => {
    socket.to(data.roomId).emit("updateCanvas", data);
    const room = rooms.find(r => r.roomId === data.roomId);
    if (room) {
      room.elements = data.updatedElements;
      room.canvasColor = data.canvasColor;
    }
  });

  // Messaging
  socket.on("sendMessage", (data) => {
    socket.to(data.roomId).emit("getMessage", data);
  });

  // Cursor movement
  socket.on("cursorMove", (data) => {
    socket.to(data.roomId).emit("userCursor", {
      socketId: data.socketId,
      userName: data.userName,
      x: data.x,
      y: data.y
    });
  });

  // Keep-alive
  socket.on("pong", () => {
    setTimeout(() => socket.emit("ping"), 120000);
  });

  // Disconnection handling
  socket.on("disconnect", () => {
    rooms.forEach(room => {
      room.users = room.users.filter(user => user.socketId !== socket.id);
      if (room.users.length === 0) {
        rooms = rooms.filter(r => r.roomId !== room.roomId);
      }
    });
    console.log(`Disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});