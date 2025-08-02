"use client"
import { tools } from "@/assets"
import { TwitterPicker, SliderPicker } from "react-color"
import { useState } from "react"
import { LuUndo2, LuRedo2 } from "react-icons/lu"
import { BsToggleOff, BsToggleOn } from "react-icons/bs"
import { MdFormatBold, MdSave } from "react-icons/md"
import { FiUser } from "react-icons/fi"
import Menu from "./Menu"
import Session from "./Session"
import Chat from "./Chat"
import { getCurrentUser } from "../lib/auth"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

const Toolbar = ({
  color,
  tool,
  setColor,
  setTool,
  elements,
  setElements,
  history,
  setHistory,
  canvasRef,
  strokeWidth,
  setStrokeWidth,
  canvasColor,
  setCanvasColor,
  userName,
  setUserName,
  isLive,
  setIsLive,
  params,
  updateCanvas,
  sendMessage,
  messages,
  socketId,
  autoCorrectShapes,
  setAutoCorrectShapes,
  fontSize,
  setFontSize,
  isBold,
  setIsBold,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTextOptions, setShowTextOptions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    context.fillStyle = canvasColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    setElements([])
    setHistory([])
    updateCanvas([])
  }

  const undo = () => {
    if (elements.length < 1) return
    setHistory((prevHistory) => [...prevHistory, elements[elements.length - 1]])
    setElements((prevElements) => prevElements.filter((ele, index) => index !== elements.length - 1))
  }
  const redo = () => {
    if (history.length < 1) return
    setElements((prevElements) => [...prevElements, history[history.length - 1]])
    setHistory((prevHistory) => prevHistory.filter((ele, index) => index !== history.length - 1))
  }

  const saveBoard = async () => {
    const user = getCurrentUser()
    if (!user) {
      toast.error("Please login to save boards")
      return
    }

    if (!canvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    setIsSaving(true)
    try {
      // Generate thumbnail
      const canvas = canvasRef.current
      const thumbnailCanvas = document.createElement("canvas")
      thumbnailCanvas.width = 300
      thumbnailCanvas.height = 200
      const thumbnailCtx = thumbnailCanvas.getContext("2d")
      thumbnailCtx.fillStyle = canvasColor
      thumbnailCtx.fillRect(0, 0, 300, 200)

      // Scale down the main canvas to fit thumbnail
      const scale = Math.min(300 / canvas.width, 200 / canvas.height)
      const scaledWidth = canvas.width * scale
      const scaledHeight = canvas.height * scale
      const offsetX = (300 - scaledWidth) / 2
      const offsetY = (200 - scaledHeight) / 2

      thumbnailCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight)
      const thumbnail = thumbnailCanvas.toDataURL()

      const boardTitle = prompt("Enter board title:") || `Board ${new Date().toLocaleDateString()}`

      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: boardTitle,
          elements: elements,
          canvasColor: canvasColor,
          thumbnail: thumbnail,
        }),
      })

      if (response.ok) {
        toast.success("Board saved successfully!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to save board")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full z-20">
      <div className="flex flex-row p-4 justify-between w-[95vw] gap-3 md:gap-6">
        <div className="flex items-center gap-4">
          <div className="brand-text text-2xl md:text-3xl font-bold hidden md:block">SaathWrite</div>
          <button
            onClick={() => router.push("/boards")}
            className="desi-button px-4 py-2 text-sm hidden md:flex items-center gap-2"
          >
            <FiUser className="w-4 h-4" />
            My Boards
          </button>
        </div>

        <div className="flex flex-row gap-3 md:gap-6">
          <div className="toolbar-glass flex flex-row-reverse md:flex-row p-2 gap-1 max-h-12">
            {tools
            .filter((item) => item.value !== "text")
            .map((item, index) => (
              <button
                title={item.title}
                key={index}
                className={`flex text-lg flex-col items-center rounded-xl justify-center p-2 cursor-pointer font-medium transition-all duration-200 ${
                  item.value === tool
                    ? "bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white shadow-lg"
                    : "text-gray-300 hover:bg-[#8B5CF6] hover:text-white"
                }`}
                onClick={() => {
                  setTool(item.value)
                  if (item.value === "text") {
                    setShowTextOptions(true)
                  } else {
                    setShowTextOptions(false)
                  }
                }}
              >
                {item.icon}
              </button>
            ))}
            <div className="relative flex items-center justify-center" title="Pick Color">
              <div
                style={{ backgroundColor: color }}
                className="rounded-xl w-10 h-10 cursor-pointer border-2 border-white shadow-lg hover:scale-110 transition-transform"
                onClick={() => setShowColorPicker(true)}
              ></div>
              {showColorPicker && (
                <div className="absolute top-12 left-0 flex flex-col ">
                  <div className="fixed inset-0 z-30" onClick={() => setShowColorPicker(false)}></div>
                  <TwitterPicker
                    className=" z-40"
                    color={color}
                    onChangeComplete={(color) => setColor(color.hex)}
                    colors={[
                      "#f44336",
                      "#e91e63",
                      "#f70707",
                      "#9c27b0",
                      "#673ab7",
                      "#3f51b5",
                      "#2196f3",
                      "#03a9f4",
                      "#00bcd4",
                      "#009688",
                      "#4caf50",
                      "#8bc34a",
                      "#cddc39",
                      "#ffeb3b",
                      "#ffc107",
                      "#ff9800",
                      "#ff5722",
                      "#795548",
                      "#607d8b",
                      "#000000",
                      "#ffffff",
                    ]}
                  />
                  <SliderPicker
                    width="276px"
                    className=" z-40"
                    color={color}
                    onChangeComplete={(color) => setColor(color.hex)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text Options - Fixed positioning to not distort header */}
          {showTextOptions && (
            <div className="toolbar-glass flex flex-row p-2 gap-2 max-h-12 min-w-fit">
              <div className="flex items-center gap-2 px-3">
                <label className="text-xs text-gray-300 font-medium whitespace-nowrap">Size:</label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number.parseInt(e.target.value))}
                  className="w-16 accent-[#A855F7]"
                />
                <span className="text-xs text-white font-bold w-6">{fontSize}</span>
              </div>
              <button
                onClick={() => setIsBold(!isBold)}
                className={`flex text-lg items-center justify-center p-2 rounded-xl cursor-pointer transition-all ${
                  isBold ? "bg-[#A855F7] text-white" : "text-gray-300 hover:bg-[#8B5CF6] hover:text-white"
                }`}
                title="Bold"
              >
                <MdFormatBold />
              </button>
            </div>
          )}

          {/* Auto Shape Correction Toggle */}
          <div className="toolbar-glass flex flex-row p-2 gap-1 max-h-12">
            <button
              onClick={() => setAutoCorrectShapes(!autoCorrectShapes)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#8B5CF6] rounded-xl transition-all"
              title="Auto Shapes"
            >
              {autoCorrectShapes ? (
                <BsToggleOn className="text-[#A855F7] text-xl" />
              ) : (
                <BsToggleOff className="text-xl" />
              )}
              <span className="hidden md:inline font-medium">Auto Shapes</span>
            </button>
          </div>

          <div className="toolbar-glass flex flex-row p-2 gap-1 max-h-12">
            <button
              onClick={undo}
              className="flex flex-col text-xl items-center rounded-lg justify-center p-2 cursor-pointer font-extrabold text-gray-300 hover:bg-[#8B5CF6] hover:text-white transition-all"
            >
              <LuUndo2 />
            </button>
            <div className="border-gray-400 border-r h-6 mt-[5px]" />
            <button
              onClick={redo}
              className="flex text-xl flex-col items-center rounded-lg justify-center p-2 cursor-pointer font-extrabold text-gray-300 hover:bg-[#8B5CF6] hover:text-white transition-all"
            >
              <LuRedo2 />
            </button>
          </div>

          {/* Save Board Button */}
          <div className="toolbar-glass flex flex-row p-2 gap-1 max-h-12">
            <button
              onClick={saveBoard}
              disabled={isSaving}
              className="desi-button flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save Board"
            >
              <MdSave />
              <span className="hidden md:inline">{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>

          <div className="flex flex-row gap-5 max-h-11 max-sm:fixed bottom-4 left-4">
            <Session
              userName={userName}
              setUserName={setUserName}
              isLive={isLive}
              setIsLive={setIsLive}
              params={params}
            />
            <Chat isLive={isLive} params={params} sendMessage={sendMessage} messages={messages} socketId={socketId} />
          </div>
        </div>
        <div />
        <Menu
          clearCanvas={clearCanvas}
          setStrokeWidth={setStrokeWidth}
          strokeWidth={strokeWidth}
          setCanvasColor={setCanvasColor}
          canvasColor={canvasColor}
          elements={elements}
          setElements={setElements}
          updateCanvas={updateCanvas}
        />
      </div>
    </div>
  )
}

export default Toolbar
