"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthUser, getMe, LoginResponse, logout as apiLogout } from "@/lib/api/auth"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshMe = async () => {
    try {
      const me = await getMe()
      setUser(me)
    } catch (err) {
      console.error("Failed to refresh user info:", err)
      logout()
    }
  }

  const login = (data: LoginResponse) => {
    localStorage.setItem("guto-auth-token", data.token)
    setToken(data.token)
    setUser({
      userId: data.userId,
      role: data.role,
      coachId: data.coachId,
      subscriptionStatus: data.subscriptionStatus,
      subscriptionEndsAt: data.subscriptionEndsAt,
    })
  }

  const logout = () => {
    localStorage.removeItem("guto-auth-token")
    setToken(null)
    setUser(null)
    void apiLogout().catch(() => {})
    router.push("/login")
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("guto-auth-token")
    if (storedToken) {
      setToken(storedToken)
      getMe()
        .then((me) => {
          setUser(me)
          setIsLoading(false)
        })
        .catch(() => {
          localStorage.removeItem("guto-auth-token")
          setToken(null)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
