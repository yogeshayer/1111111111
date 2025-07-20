"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationPanel } from "@/components/notification-panel"
import { SettingsDropdown } from "@/components/settings-dropdown"

interface AppUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  avatar?: string
  adminId?: string
}

export function AppHeader() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  if (!currentUser) return null

  return (
    <header className="bg-slate-800 dark:bg-slate-900 text-white border-b border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ChoreBoard</h1>
              <p className="text-sm text-slate-300">Welcome back, {currentUser.name}!</p>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <ThemeToggle />
            <SettingsDropdown user={currentUser} />
          </div>
        </div>
      </div>
    </header>
  )
}
