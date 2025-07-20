"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds
const WARNING_TIME = 60 * 1000 // 1 minute warning

export function useSessionTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const logout = useCallback(() => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionStartTime")
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    router.push("/")
  }, [router])

  const checkSessionValidity = useCallback(() => {
    const sessionStart = localStorage.getItem("sessionStartTime")
    const currentUser = localStorage.getItem("currentUser")

    if (!sessionStart || !currentUser) {
      router.push("/")
      return false
    }

    const sessionAge = Date.now() - Number.parseInt(sessionStart)
    if (sessionAge > SESSION_TIMEOUT) {
      logout()
      return false
    }

    return true
  }, [logout, router])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      // Show warning dialog logic would go here
      console.log("Session warning: 1 minute remaining")
    }, SESSION_TIMEOUT - WARNING_TIME)

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      logout()
    }, SESSION_TIMEOUT)
  }, [logout])

  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    // Initialize session
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser && !localStorage.getItem("sessionStartTime")) {
      localStorage.setItem("sessionStartTime", Date.now().toString())
    }

    // Check session validity on mount
    if (!checkSessionValidity()) return

    // Set up activity listeners
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the timer
    resetTimer()

    // Check session on window focus
    const handleFocus = () => {
      checkSessionValidity()
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
      window.removeEventListener("focus", handleFocus)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [handleActivity, resetTimer, checkSessionValidity])

  return {
    logout,
    checkSessionValidity,
    resetTimer,
  }
}
