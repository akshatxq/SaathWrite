"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { setToken } from "../../lib/auth"
import { toast } from "react-hot-toast"

export default function Signup() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        toast.success("Account created successfully!")
        router.push("/")
      } else {
        toast.error(data.message || "Signup failed")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#2D1B69] to-[#1E1B4B] flex items-center justify-center p-4">
      <div className="w-full max-w-md desi-card">
        <div className="text-center p-6 pb-4">
          <h2 className="brand-text text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-gray-300">Join SaathWrite and start collaborating</p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="desi-input w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="desi-input w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="desi-input w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="desi-input w-full"
              />
            </div>
            <button
              type="submit"
              className="desi-button w-full py-3 text-base font-semibold disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
