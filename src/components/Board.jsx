"use client"
import { useEffect, useLayoutEffect } from "react"
import rough from "roughjs/bin/rough"

import { useState } from "react"

const generator = rough.generator()
const Board = ({
  canvasRef,
  ctx, // This is a ref, not a direct context object
  color,
  setElements,
  elements,
  tool,
  canvasColor,
  strokeWidth,
  updateCanvas,
  autoCorrectShapes,
  fontSize,
  isBold,
  sendCursorPosition,
  userCursors,
  socketId,
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [eraser, setEraser] = useState(false)
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, text: "" })

  // Effect to initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return // Ensure canvas element exists

    canvas.height = window.innerHeight * 2
    canvas.width = window.innerWidth * 2
    const context = canvas.getContext("2d")

    context.strokeWidth = 30
    context.scale(2, 2)
    context.lineCap = "round"
    context.strokeStyle = color // Initial stroke style
    context.lineWidth = 5
    ctx.current = context // Store context in ref
  }, [canvasRef]) // Dependency on canvasRef to ensure it's stable

  // Effect to draw elements on canvas
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const context = ctx.current // Access context from ref
    if (!canvas || !context) return // Ensure both canvas and its context are available

    const roughCanvas = rough.canvas(canvas)

    // Defensive check: Ensure elements is an array before proceeding
    if (!Array.isArray(elements)) {
      console.error("Elements prop is not an array:", elements)
      return
    }

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)
    // Fill with background color
    context.fillStyle = canvasColor
    context.fillRect(0, 0, canvas.width, canvas.height)

    elements.forEach((ele) => {
      // Set context properties before drawing each element, using element's properties or fallbacks
      context.strokeStyle = ele.stroke || color
      context.lineWidth = ele.strokeWidth || strokeWidth

      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          }),
        )
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          }),
        )
      } else if (ele.element === "pencil") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: ele.strokeWidth,
        })
      } else if (ele.element === "circle") {
        roughCanvas.draw(
          generator.ellipse(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          }),
        )
      } else if (ele.element === "eraser") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: ele.strokeWidth,
        })
      } else if (ele.element === "text") {
        context.font = `${ele.isBold ? "bold" : "normal"} ${ele.fontSize}px Arial`
        context.fillStyle = ele.stroke
        context.fillText(ele.text, ele.offsetX, ele.offsetY)
      }
    })
  }, [elements, canvasColor, strokeWidth, fontSize, isBold, color]) // Added color to dependencies

  const detectShape = (path) => {
    if (!autoCorrectShapes || path.length < 10) return null

    const startPoint = path[0]
    const endPoint = path[path.length - 1]
    const distance = Math.sqrt(Math.pow(endPoint[0] - startPoint[0], 2) + Math.pow(endPoint[1] - startPoint[1], 2))

    // If start and end are close, might be a circle
    if (distance < 50) {
      const centerX = (Math.max(...path.map((p) => p[0])) + Math.min(...path.map((p) => p[0]))) / 2
      const centerY = (Math.max(...path.map((p) => p[1])) + Math.min(...path.map((p) => p[1]))) / 2
      const radius =
        Math.max(
          Math.max(...path.map((p) => p[0])) - Math.min(...path.map((p) => p[0])),
          Math.max(...path.map((p) => p[1])) - Math.min(...path.map((p) => p[1])),
        ) / 2

      return {
        type: "circle",
        offsetX: centerX - radius,
        offsetY: centerY - radius,
        width: radius * 2,
        height: radius * 2,
      }
    }

    // Check for rectangle (4 corners)
    const minX = Math.min(...path.map((p) => p[0]))
    const maxX = Math.max(...path.map((p) => p[0]))
    const minY = Math.min(...path.map((p) => p[1]))
    const maxY = Math.max(...path.map((p) => p[1]))

    const width = maxX - minX
    const height = maxY - minY

    if (width > 50 && height > 50) {
      return {
        type: "rect",
        offsetX: minX,
        offsetY: minY,
        width: width,
        height: height,
      }
    }

    return null
  }

  const handleMouseDown = (e) => {
    let offsetX
    let offsetY
    if (e.touches) {
      // Touch event
      var bcr = e.target.getBoundingClientRect()
      offsetX = e.targetTouches[0].clientX - bcr.x
      offsetY = e.targetTouches[0].clientY - bcr.y
    } else {
      // Mouse event
      offsetX = e.nativeEvent.offsetX
      offsetY = e.nativeEvent.offsetY
    }

    if (tool === "text") {
      setTextInput({ show: true, x: offsetX, y: offsetY, text: "" })
      return
    }

    if (tool === "pencil") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: color,
          element: tool,
          strokeWidth: strokeWidth,
        },
      ])
    } else if (tool === "eraser") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: canvasColor,
          element: tool,
          strokeWidth: strokeWidth > 30 ? strokeWidth : 30,
        },
      ])
    } else {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          stroke: color,
          element: tool,
          strokeWidth: strokeWidth,
        },
      ])
    }
    setIsDrawing(true)
    updateCanvas(elements)
  }

  const handleMouseUp = () => {
    if (isDrawing && tool === "pencil" && autoCorrectShapes) {
      const lastElement = elements[elements.length - 1]
      if (lastElement && lastElement.path) {
        const detectedShape = detectShape(lastElement.path)
        if (detectedShape) {
          setElements((prevElements) => {
            const newElements = [...prevElements]
            newElements[newElements.length - 1] = {
              ...detectedShape,
              stroke: lastElement.stroke,
              strokeWidth: lastElement.strokeWidth,
              element: detectedShape.type,
            }
            return newElements
          })
        }
      }
    }
    setIsDrawing(false)
  }

  const handleMouseMove = (e) => {
    let offsetX
    let offsetY
    if (e.touches) {
      // Touch event
      var bcr = e.target.getBoundingClientRect()
      offsetX = e.targetTouches[0].clientX - bcr.x
      offsetY = e.targetTouches[0].clientY - bcr.y
    } else {
      // Mouse event
      offsetX = e.nativeEvent.offsetX
      offsetY = e.nativeEvent.offsetY
    }

    // Send cursor position for user tags
    sendCursorPosition(e.clientX, e.clientY)

    setEraser({
      x: e.clientX,
      y: e.clientY,
    })
    if (!isDrawing) {
      return
    }

    if (tool === "rect") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
                stroke: ele.stroke,
                element: ele.element,
                strokeWidth: ele.strokeWidth,
              }
            : ele,
        ),
      )
    } else if (tool === "line") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                width: offsetX,
                height: offsetY,
                stroke: ele.stroke,
                element: ele.element,
                strokeWidth: ele.strokeWidth,
              }
            : ele,
        ),
      )
    } else if (tool === "pencil") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                path: [...ele.path, [offsetX, offsetY]],
                stroke: ele.stroke,
                element: ele.element,
                strokeWidth: ele.strokeWidth,
              }
            : ele,
        ),
      )
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - elements[elements.length - 1].offsetX, 2) +
          Math.pow(offsetY - elements[elements.length - 1].offsetY, 2),
      )
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                width: 2 * radius,
                height: 2 * radius,
                stroke: ele.stroke,
                element: ele.element,
                strokeWidth: ele.strokeWidth,
              }
            : ele,
        ),
      )
    } else if (tool === "eraser") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                offsetX: ele.offsetX,
                offsetY: ele.offsetY,
                path: [...ele.path, [offsetX, offsetY]],
                stroke: ele.stroke,
                element: ele.element,
                strokeWidth: ele.strokeWidth,
              }
            : ele,
        ),
      )
    }
    updateCanvas(elements)
  }

  const handleTextSubmit = () => {
    if (textInput.text.trim()) {
      const newElement = {
        offsetX: textInput.x,
        offsetY: textInput.y,
        text: textInput.text,
        stroke: color,
        element: "text",
        fontSize: fontSize,
        isBold: isBold,
      }
      setElements((prevElements) => [...prevElements, newElement])
      updateCanvas([...elements, newElement])
    }
    setTextInput({ show: false, x: 0, y: 0, text: "" })
  }

  const handleTextKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleTextSubmit()
    }
    if (e.key === "Escape") {
      setTextInput({ show: false, x: 0, y: 0, text: "" })
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className="absolute top-0 left-0 w-screen h-screen"
    >
      <canvas
        ref={canvasRef}
        className={`absolute border-2 border-black w-screen h-screen ${tool === "eraser" ? "cursor-none" : tool === "text" ? "cursor-text" : "cursor-crosshair"}`}
        style={{ backgroundColor: canvasColor }}
      />

      {/* Eraser cursor */}
      <div
        className="eraser pointer-events-none bg-secondary"
        style={{
          display: tool === "eraser" ? "block" : "none",
          left: eraser.x,
          top: eraser.y,
          minHeight: `30px`,
          minWidth: `30px`,
          height: `${strokeWidth}px`,
          width: `${strokeWidth}px`,
        }}
      />

      {/* Text input - Fixed positioning and styling */}
      {textInput.show && (
        <div
          className="absolute z-[100] bg-white rounded-lg shadow-xl border-2 border-[#A855F7] p-1"
          style={{
            left: Math.max(10, Math.min(textInput.x, window.innerWidth - 220)),
            top: Math.max(10, Math.min(textInput.y, window.innerHeight - 50)),
          }}
        >
          <input
            type="text"
            value={textInput.text}
            onChange={(e) => setTextInput((prev) => ({ ...prev, text: e.target.value }))}
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextSubmit}
            autoFocus
            className="px-3 py-2 text-black border-none outline-none rounded-lg min-w-[200px] bg-white"
            style={{
              fontSize: `${Math.min(fontSize, 24)}px`,
              fontWeight: isBold ? "bold" : "normal",
            }}
            placeholder="Type your text..."
          />
        </div>
      )}

      {/* User cursors */}
      {Object.entries(userCursors).map(([id, cursor]) => {
        if (id === socketId) return null
        return (
          <div key={id} className="absolute pointer-events-none z-40" style={{ left: cursor.x, top: cursor.y }}>
            <div className="bg-primary text-white px-2 py-1 rounded text-xs whitespace-nowrap transform -translate-x-1/2 -translate-y-8">
              {cursor.userName}
            </div>
            <div className="w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )
      })}
    </div>
  )
}

export default Board