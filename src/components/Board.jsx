import React, { useEffect, useRef, useState } from "react";

const Board = ({
  canvasRef,
  color,
  setElements,
  elements = [],
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
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Array.isArray(elements)) {
      elements.forEach((ele) => {
        ctx.beginPath();
        ctx.strokeStyle = ele.color || color;
        ctx.lineWidth = ele.strokeWidth || strokeWidth;
        ctx.moveTo(ele.x1, ele.y1);
        ctx.lineTo(ele.x2, ele.y2);
        ctx.stroke();
      });
    }
  }, [elements, canvasRef, canvasColor]);

  const getXY = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getXY(e);
    isDrawing.current = true;
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const { x, y } = getXY(e);

    if (sendCursorPosition && socketId) {
      sendCursorPosition({ x, y, socketId });
    }

    if (!isDrawing.current || !ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Add new element to state
    setElements((prev) => [
      ...prev,
      {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: x,
        y2: y,
        color,
        strokeWidth,
      },
    ]);

    setStartPoint({ x, y });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ border: "1px solid #ccc", display: "block", cursor: "crosshair" }}
    />
  );
};

export default Board;
