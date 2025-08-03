"use client"
import Board from "@/components/Board"
import Toolbar from "@/components/Toolbar"
import AuthGuard from "@/components/AuthGuard"
import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { getCurrentUser } from "@/lib/auth"

export default function Home({ params }) {
  const canvasRef = useRef(null)
  const ctx = useRef(null)
  const [color, setColor] = useState("#ffffff")
  const [elements, setElements] = useState([])
  const [history, setHistory] = useState([])
  const [tool, setTool] = useState("pencil")
  const [canvasColor, setCanvasColor] = useState("#121212")
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [socket, setSocket] = useState(null)
  const [userName, setUserName] = useState("Anonymous")
  const [isLive, setIsLive] = useState(false)
  const [messages, setMessages] = useState([])
  const [autoCorrectShapes, setAutoCorrectShapes] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)
  const [userCursors, setUserCursors] = useState({})

  const server = process.env.NEXT_PUBLIC_SERVER_URL || "https://saathwrite.onrender.com"
  const connectionOptions = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserName(user.username)
    }

    if (params?.roomId?.toString().length !== 20) {
      setIsLive(false)
      return
    }
    setIsLive(true)
    const socket = io(server, connectionOptions)
    setSocket(socket)

    socket.on("updateCanvas", (data) => {
      setElements(data.updatedElements)
      setCanvasColor(data.canvasColor)
    })

    socket.on("getMessage", (message) => {
      setMessages((messages) => [...messages, message])
    })

    socket.on("userCursor", (data) => {
      setUserCursors((prev) => ({
        ...prev,
        [data.socketId]: data,
      }))
    })

    socket.on("userDisconnected", (socketId) => {
      setUserCursors((prev) => {
        const newCursors = { ...prev }
        delete newCursors[socketId]
        return newCursors
      })
    })

    // ping server every 2 min to prevent render server from sleeping
    socket.on("ping", () => {
      setTimeout(() => {
        socket.emit("pong")
      }, 120000)
    })

    const data = {
      roomId: params.roomId,
      userName: user?.username || "Anonymous",
    }
    socket.emit("joinRoom", data)

    return () => {
      socket.off("updateCanvas")
      socket.off("getMessage")
      socket.off("userCursor")
      socket.off("userDisconnected")
    }
  }, [params?.roomId, server])

  const sendMessage = (message) => {
    const data = {
      message: message,
      userName: userName,
      roomId: params.roomId,
      socketId: socket.id,
    }
    if (socket) {
      socket.emit("sendMessage", data)
    }
  }

  const updateCanvas = (updatedElements) => {
    if (socket) {
      const data = {
        roomId: params.roomId,
        userName: userName,
        updatedElements: updatedElements,
        canvasColor: canvasColor,
      }
      socket.emit("updateCanvas", data)
    }
  }

  const sendCursorPosition = (x, y) => {
    if (socket && isLive) {
      socket.emit("cursorMove", {
        roomId: params.roomId,
        userName: userName,
        x: x,
        y: y,
        socketId: socket.id,
      })
    }
  }

  return (
    <AuthGuard>
      <div className=" relative">
        <div className=" fixed top-0 z-20">
          <Toolbar
            color={color}
            setColor={setColor}
            tool={tool}
            setTool={setTool}
            history={history}
            setHistory={setHistory}
            elements={elements}
            setElements={setElements}
            canvasRef={canvasRef}
            canvasColor={canvasColor}
            setCanvasColor={setCanvasColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            userName={userName}
            setUserName={setUserName}
            isLive={isLive}
            setIsLive={setIsLive}
            params={params}
            updateCanvas={updateCanvas}
            messages={messages}
            sendMessage={sendMessage}
            socketId={socket?.id}
            autoCorrectShapes={autoCorrectShapes}
            setAutoCorrectShapes={setAutoCorrectShapes}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isBold={isBold}
            setIsBold={setIsBold}
          />
        </div>
        <Board
          canvasRef={canvasRef}
          ctx={ctx}
          color={color}
          tool={tool}
          elements={elements}
          setElements={setElements}
          history={history}
          setHistory={setHistory}
          canvasColor={canvasColor}
          strokeWidth={strokeWidth}
          updateCanvas={updateCanvas}
          autoCorrectShapes={autoCorrectShapes}
          fontSize={fontSize}
          isBold={isBold}
          sendCursorPosition={sendCursorPosition}
          userCursors={userCursors}
          socketId={socket?.id}
        />
      </div>
    </AuthGuard>
  )
}
