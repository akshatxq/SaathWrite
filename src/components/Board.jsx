import React, { useEffect } from "react";

const Board = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements = [], // ✅ default to empty array
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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
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
  

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (sendCursorPosition && socketId) {
      sendCursorPosition({ x, y, socketId });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={handleMouseMove}
      style={{ border: "1px solid #ccc", display: "block" }}
    />
  );
};

export default Board;
