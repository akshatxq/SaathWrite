'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bin/rough';

const generator = rough.generator();

const Board = ({
    canvasRef,
    ctx,
    color,
    setElements,
    elements,
    tool,
    canvasColor,
    strokeWidth,
    updateCanvas,
    socket,
}) => {
    // Always ensure elements is an array
    const safeElements = Array.isArray(elements) ? elements : [];

    const [isDrawing, setIsDrawing] = useState(false);
    const [eraser, setEraser] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.height = window.innerHeight * 2;
        canvas.width = window.innerWidth * 2;
        const context = canvas.getContext("2d");

        context.strokeWidth = 30;
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = 5;
        ctx.current = context;
    }, [canvasRef, color, ctx]);

    useLayoutEffect(() => {
        const roughCanvas = rough.canvas(canvasRef.current);
        if (safeElements.length > 0) {
            ctx.current.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
        }
        safeElements.forEach((ele) => {
            if (ele.element === "rect") {
                roughCanvas.draw(
                    generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
                        stroke: ele.stroke,
                        roughness: 0,
                        strokeWidth: ele.strokeWidth
                    })
                );
            } else if (ele.element === "line") {
                roughCanvas.draw(
                    generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
                        stroke: ele.stroke,
                        roughness: 0,
                        strokeWidth: ele.strokeWidth,
                    })
                );
            } else if (ele.element === "pencil") {
                roughCanvas.linearPath(Array.isArray(ele.path) ? ele.path : [], {
                    stroke: ele.stroke,
                    roughness: 0,
                    strokeWidth: ele.strokeWidth,
                });
            }
            else if (ele.element === "circle") {
                roughCanvas.draw(
                    generator.ellipse(ele.offsetX, ele.offsetY, ele.width, ele.height, {
                        stroke: ele.stroke,
                        roughness: 0,
                        strokeWidth: ele.strokeWidth,
                    })
                );
            } else if (ele.element === "eraser") {
                roughCanvas.linearPath(Array.isArray(ele.path) ? ele.path : [], {
                    stroke: ele.stroke,
                    roughness: 0,
                    strokeWidth: ele.strokeWidth,
                });
            }
        });
    }, [safeElements, ctx, canvasRef]);

    const handleMouseDown = (e) => {
        let offsetX;
        let offsetY;
        if (e.touches) {
            const bcr = e.target.getBoundingClientRect();
            offsetX = e.targetTouches[0].clientX - bcr.x;
            offsetY = e.targetTouches[0].clientY - bcr.y;
        } else {
            offsetX = e.nativeEvent.offsetX;
            offsetY = e.nativeEvent.offsetY;
        }

        if (tool === "pencil") {
            setElements((prev) => [
                ...(Array.isArray(prev) ? prev : []),
                {
                    offsetX,
                    offsetY,
                    path: [[offsetX, offsetY]],
                    stroke: color,
                    element: tool,
                    strokeWidth: strokeWidth,
                },
            ]);
        }
        else if (tool === "eraser") {
            setElements((prev) => [
                ...(Array.isArray(prev) ? prev : []),
                {
                    offsetX,
                    offsetY,
                    path: [[offsetX, offsetY]],
                    stroke: canvasColor,
                    element: tool,
                    strokeWidth: strokeWidth > 30 ? strokeWidth : 30,
                },
            ]);
        }
        else {
            setElements((prev) => [
                ...(Array.isArray(prev) ? prev : []),
                {
                    offsetX,
                    offsetY,
                    stroke: color,
                    element: tool,
                    strokeWidth: strokeWidth
                },
            ]);
        }
        setIsDrawing(true);
        updateCanvas(safeElements);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseMove = (e) => {
        setEraser({
            x: e.clientX,
            y: e.clientY,
        });
        if (!isDrawing) return;

        let offsetX;
        let offsetY;
        if (e.touches) {
            const bcr = e.target.getBoundingClientRect();
            offsetX = e.targetTouches[0].clientX - bcr.x;
            offsetY = e.targetTouches[0].clientY - bcr.y;
        } else {
            offsetX = e.nativeEvent.offsetX;
            offsetY = e.nativeEvent.offsetY;
        }

        if (safeElements.length === 0) return;

        if (tool === "rect") {
            setElements((prev) =>
                (Array.isArray(prev) ? prev : []).map((ele, index) =>
                    index === safeElements.length - 1
                        ? { ...ele, width: offsetX - ele.offsetX, height: offsetY - ele.offsetY }
                        : ele
                )
            );
        } else if (tool === "line") {
            setElements((prev) =>
                (Array.isArray(prev) ? prev : []).map((ele, index) =>
                    index === safeElements.length - 1
                        ? { ...ele, width: offsetX, height: offsetY }
                        : ele
                )
            );
        } else if (tool === "pencil") {
            setElements((prev) =>
                (Array.isArray(prev) ? prev : []).map((ele, index) =>
                    index === safeElements.length - 1
                        ? { ...ele, path: [...(Array.isArray(ele.path) ? ele.path : []), [offsetX, offsetY]] }
                        : ele
                )
            );
        }
        else if (tool === "circle") {
            const lastElement = safeElements[safeElements.length - 1];
            if (!lastElement) return;
            const radius = Math.sqrt(
                Math.pow(offsetX - lastElement.offsetX, 2) +
                Math.pow(offsetY - lastElement.offsetY, 2)
            );
            setElements((prev) =>
                (Array.isArray(prev) ? prev : []).map((ele, index) =>
                    index === safeElements.length - 1
                        ? { ...ele, width: 2 * radius, height: 2 * radius }
                        : ele
                )
            );
        }
        else if (tool === "eraser") {
            setElements((prev) =>
                (Array.isArray(prev) ? prev : []).map((ele, index) =>
                    index === safeElements.length - 1
                        ? { ...ele, path: [...(Array.isArray(ele.path) ? ele.path : []), [offsetX, offsetY]] }
                        : ele
                )
            );
        }
        updateCanvas(safeElements);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className='absolute top-0 left-0 w-screen h-screen'
        >
            <canvas
                ref={canvasRef}
                className={`absolute border-2 border-black w-screen h-screen ${tool === "eraser" ? "cursor-none" : "cursor-crosshair"}`}
                style={{ backgroundColor: canvasColor }}
            />
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
        </div>
    );
}

export default Board;
