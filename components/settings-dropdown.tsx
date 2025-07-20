"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut } from "lucide-react"
import { toast } from "sonner"

export function SettingsDropdown() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      // Save any pending data before logout
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        const userDataKey = userData.isAdmin ? `choreboardData_${userData.id}` : `choreboardData_${userData.adminId}`

        // Ensure data is saved
        const choreboardData = localStorage.getItem(userDataKey)
        if (choreboardData) {
          localStorage.setItem("choreboardData", choreboardData)
        }
      }

      // Clear session data
      localStorage.removeItem("currentUser")
      localStorage.removeItem("tempUserData")

      // Clear any cached data
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("temp_") || key.startsWith("session_")) {
          localStorage.removeItem(key)
        }
      })

      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error during logout, but you've been logged out")

      // Force logout even if there's an error
      localStorage.removeItem("currentUser")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
