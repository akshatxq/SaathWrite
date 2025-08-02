"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "../lib/auth"

const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setIsAuthenticated(true)
    } else {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#121212] text-5xl text-white flex justify-center items-center">
        <span className="loader"></span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

export default AuthGuard
