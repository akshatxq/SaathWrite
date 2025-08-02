import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "../../../lib/mongodb"
import Board from "../../../models/Board"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    await connectDB()

    const boards = await Board.find({ owner: decoded.userId })
      .sort({ updatedAt: -1 })
      .select("title thumbnail createdAt updatedAt")

    return NextResponse.json({ boards })
  } catch (error) {
    console.error("Get boards error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    const { title, elements, canvasColor, thumbnail } = await request.json()

    await connectDB()

    const board = await Board.create({
      title,
      elements,
      canvasColor,
      thumbnail,
      owner: decoded.userId,
    })

    return NextResponse.json({ board })
  } catch (error) {
    console.error("Create board error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
