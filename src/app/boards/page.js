"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AuthGuard from "../../components/AuthGuard"
import { getCurrentUser, logout } from "../../lib/auth"
import { toast } from "react-hot-toast"
import { Plus, Trash2, Edit } from "lucide-react"

export default function MyBoards() {
  const [boards, setBoards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      fetchBoards()
    }
  }, [])

  const fetchBoards = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/boards`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBoards(data.boards)
      } else {
        toast.error("Failed to fetch boards")
      }
    } catch (error) {
      toast.error("An error occurred while fetching boards")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBoard = async (boardId) => {
    if (!confirm("Are you sure you want to delete this board?")) return

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        setBoards(boards.filter((board) => board._id !== boardId))
        toast.success("Board deleted successfully")
      } else {
        toast.error("Failed to delete board")
      }
    } catch (error) {
      toast.error("An error occurred while deleting board")
    }
  }

  const createNewBoard = () => {
    router.push("/")
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
      <div className="min-h-screen bg-[#121212] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Boards</h1>
              <p className="text-gray-400">Welcome back, {user?.username}!</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={createNewBoard}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Board
              </button>
              <button
                onClick={logout}
                className="border border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent font-medium py-2 px-4 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No boards yet</h3>
              <p className="text-gray-400 mb-6">Create your first board to get started</p>
              <button
                onClick={createNewBoard}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Board
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boards.map((board) => (
                <div
                  key={board._id}
                  className="bg-secondary border border-tertiary hover:border-primary/50 transition-colors cursor-pointer group rounded-lg shadow-lg"
                >
                  <div className="p-4">
                    <div className="aspect-video bg-tertiary rounded-lg mb-3 overflow-hidden">
                      {board.thumbnail ? (
                        <img
                          src={board.thumbnail || "/placeholder.svg"}
                          alt={board.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-white text-lg font-semibold truncate mb-1">{board.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Updated {new Date(board.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent text-sm font-medium py-1 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                        onClick={() => router.push(`/board/${board._id}`)}
                      >
                        <Edit className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        className="border border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent text-sm font-medium py-1 px-3 rounded-md transition-colors"
                        onClick={() => deleteBoard(board._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
