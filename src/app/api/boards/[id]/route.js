import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "../../../../lib/mongodb"
import Board from "../../../../models/Board"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    await connectDB()

    const board = await Board.findOne({
      _id: params.id,
      owner: decoded.userId,
    })

    if (!board) {
      return NextResponse.json({ message: "Board not found" }, { status: 404 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error("Get board error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    await connectDB()

    const board = await Board.findOneAndDelete({
      _id: params.id,
      owner: decoded.userId,
    })

    if (!board) {
      return NextResponse.json({ message: "Board not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Board deleted successfully" })
  } catch (error) {
    console.error("Delete board error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const { title, elements, canvasColor, thumbnail } = await request.json()

    await connectDB()

    const board = await Board.findOneAndUpdate(
      { _id: params.id, owner: decoded.userId },
      { title, elements, canvasColor, thumbnail, updatedAt: new Date() },
      { new: true },
    )

    if (!board) {
      return NextResponse.json({ message: "Board not found" }, { status: 404 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error("Update board error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
