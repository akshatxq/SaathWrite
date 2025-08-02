import { jwtDecode } from "jwt-decode"

export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const setToken = (token) => {
  if (typeof window === "undefined") return
  localStorage.setItem("token", token)
}

export const removeToken = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
}

export const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const getCurrentUser = () => {
  const token = getToken()
  if (!token || !isTokenValid(token)) return null

  try {
    const decoded = jwtDecode(token)
    return {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

export const logout = () => {
  removeToken()
  window.location.href = "/login"
}
