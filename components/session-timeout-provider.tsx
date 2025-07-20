"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"

interface SessionTimeoutContextType {
  extendSession: () => void
  logout: () => void
  checkSessionValidity: () => boolean
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined)

export function useSessionTimeoutContext() {
  const context = useContext(SessionTimeoutContext)
  if (context === undefined) {
    throw new Error("useSessionTimeoutContext must be used within a SessionTimeoutProvider")
  }
  return context
}

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes warning
  const [lastActivity, setLastActivity] = useState(Date.now())

  const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes
  const WARNING_TIME = 2 * 60 * 1000 // 2 minutes before timeout

  const checkSessionValidity = () => {
    const currentUser = localStorage.getItem("currentUser")
    const sessionStart = localStorage.getItem("sessionStart")

    if (!currentUser || !sessionStart) {
      return false
    }

    const now = Date.now()
    const sessionAge = now - Number.parseInt(sessionStart)

    if (sessionAge > SESSION_TIMEOUT) {
      logout()
      return false
    }

    return true
  }

  const extendSession = () => {
    const now = Date.now()
    setLastActivity(now)
    localStorage.setItem("sessionStart", now.toString())
    setShowWarning(false)
    setTimeLeft(120)
  }

  const logout = () => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const user = JSON.parse(currentUser)
      // Save user's data before logout
      const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
      const currentData = localStorage.getItem("choreboardData")
      if (currentData) {
        localStorage.setItem(userDataKey, currentData)
      }
    }

    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionStart")
    localStorage.removeItem("choreboardData")
    setShowWarning(false)
    router.push("/")
  }

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    // Track user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true)
      })
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = localStorage.getItem("currentUser")
      if (!currentUser) return

      const sessionStart = localStorage.getItem("sessionStart")
      if (!sessionStart) {
        // Initialize session start time if not set
        localStorage.setItem("sessionStart", Date.now().toString())
        return
      }

      const now = Date.now()
      const sessionAge = now - Number.parseInt(sessionStart)

      // Show warning 2 minutes before timeout
      if (sessionAge > SESSION_TIMEOUT - WARNING_TIME && !showWarning) {
        setShowWarning(true)
        setTimeLeft(120)
      }

      // Auto logout after timeout
      if (sessionAge > SESSION_TIMEOUT) {
        logout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [showWarning])

  useEffect(() => {
    if (showWarning) {
      const warningInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(warningInterval)
    }
  }, [showWarning])

  // Initialize session on mount
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser && !localStorage.getItem("sessionStart")) {
      localStorage.setItem("sessionStart", Date.now().toString())
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressValue = ((120 - timeLeft) / 120) * 100

  return (
    <SessionTimeoutContext.Provider value={{ extendSession, logout, checkSessionValidity }}>
      {children}

      <AlertDialog open={showWarning} onOpenChange={() => {}}>
        <AlertDialogContent className="animate-bounce-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">⚠️ Session Expiring Soon</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>Your session will expire in {formatTime(timeLeft)} due to inactivity.</div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time remaining</span>
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
                <div>Would you like to extend your session?</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={logout}>Logout</AlertDialogCancel>
            <AlertDialogAction onClick={extendSession}>Extend Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SessionTimeoutContext.Provider>
  )
}
