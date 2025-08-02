"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AuthGuard from "../../../components/AuthGuard"
import Board from "../../../components/Board"
import Toolbar from "../../../components/Toolbar"
import { toast } from "react-hot-toast"
import { getCurrentUser } from "../../../lib/auth"

export default function SavedBoard({ params }) {
  const [boardData, setBoardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const canvasRef = useRef(null)
  const ctx = useRef(null)

  // All the same state variables as the main page
  const [color, setColor] = useState("#ffffff")
  const [elements, setElements] = useState([])
  const [history, setHistory] = useState([])
  const [tool, setTool] = useState("pencil")
  const [canvasColor, setCanvasColor] = useState("#121212")
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [userName, setUserName] = useState("Anonymous")
  const [autoCorrectShapes, setAutoCorrectShapes] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserName(user.username)
      fetchBoard()
    }
  }, [params.id])

  const fetchBoard = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/boards/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBoardData(data.board)
        setElements(data.board.elements || [])
        setCanvasColor(data.board.canvasColor || "#121212")
      } else {
        toast.error("Failed to load board")
        router.push("/boards")
      }
    } catch (error) {
      toast.error("An error occurred while loading board")
      router.push("/boards")
    } finally {
      setIsLoading(false)
    }
  }

  const updateCanvas = () => {
    // For saved boards, we don't need real-time updates
  }

  const sendCursorPosition = () => {
    // No cursor sharing for saved boards
  }

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#121212] text-5xl text-white flex justify-center items-center">
        <span className="loader"></span>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="relative">
        <div className="fixed top-0 z-20">
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
            isLive={false}
            setIsLive={() => {}}
            params={{ roomId: null }}
            updateCanvas={updateCanvas}
            messages={[]}
            sendMessage={() => {}}
            socketId={null}
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
          userCursors={{}}
          socketId={null}
        />
      </div>
    </AuthGuard>
  )
}
