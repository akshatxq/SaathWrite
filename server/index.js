const express = require("express")
const cors = require("cors")
const http = require("http")
const app = express()
const dotenv = require("dotenv")
dotenv.config()

const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",         // Local frontend
      "https://your-frontend-domain.com" // Your future frontend URL
    ],
    methods: ["GET", "POST"]
  }
})

const allowedOrigins = [
  "http://localhost:3000", // Local frontend
  "https://your-frontend-url.vercel.app" // Your future frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("hello")
})

let rooms = []
const Port = process.env.PORT || 4000

io.on("connection", (socket) => {
  console.log("a user connected")

  // Join Room
  socket.on("joinRoom", (data) => {
    console.log("joined room", data.roomId)
    socket.join(data.roomId)
    const elements = rooms.find((element) => element.roomId === data.roomId)
    if (elements) {
      // update the new user with the current canvas
      io.to(socket.id).emit("updateCanvas", elements)
      elements.user = [...elements.user, { socketId: socket.id, userName: data.userName }]
    } else {
      rooms.push({
        roomId: data.roomId,
        updatedElements: [],
        user: [{ socketId: socket.id, userName: data.userName }],
        canvasColor: "#121212",
      })
    }
  })

  // update the canvas
  socket.on("updateCanvas", (data) => {
    // Broadcast the updated elements to all connected clients
    socket.to(data.roomId).emit("updateCanvas", data)
    const elements = rooms.find((element) => element.roomId === data.roomId)
    if (elements) {
      elements.updatedElements = data.updatedElements
      elements.canvasColor = data.canvasColor
    }
  })

  // send message
  socket.on("sendMessage", (data) => {
    // Broadcast the updated elements to all connected clients
    socket.to(data.roomId).emit("getMessage", data)
    io.to(socket.id).emit("getMessage", data)
  })

  // handle cursor movement
  socket.on("cursorMove", (data) => {
    socket.to(data.roomId).emit("userCursor", {
      socketId: data.socketId,
      userName: data.userName,
      x: data.x,
      y: data.y,
    })
  })

  // ping server every 2 min to prevent render server from sleeping
  socket.on("pong", () => {
    setTimeout(() => {
      socket.emit("ping")
    }, 120000)
  })

  //clear elements when no one is in the room
  socket.on("disconnect", () => {
    // Notify other users that this user disconnected
    rooms.forEach((room) => {
      const userIndex = room.user.findIndex((user) => user.socketId === socket.id)
      if (userIndex !== -1) {
        room.user.splice(userIndex, 1)
        socket.to(room.roomId).emit("userDisconnected", socket.id)
        if (room.user.length === 0) {
          rooms = rooms.filter((r) => r.roomId !== room.roomId)
        }
      }
    })
  })
})

server.listen(Port, () => {
  console.log(`listening on *:${Port}`)
})
