"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, CheckCircle, AlertCircle, DollarSign, Calendar } from "lucide-react"

interface Notification {
  id: string
  type: "chore" | "expense" | "reminder" | "achievement"
  title: string
  message: string
  time: string
  read: boolean
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications from localStorage or generate sample ones
    const sampleNotifications: Notification[] = [
      {
        id: "1",
        type: "chore",
        title: "Chore Due Soon",
        message: "Kitchen cleaning is due tomorrow",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "2",
        type: "expense",
        title: "New Expense Added",
        message: "Groceries expense of $45.50 was added",
        time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "3",
        type: "achievement",
        title: "Achievement Unlocked!",
        message: "You've completed 5 chores this week",
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ]

    setNotifications(sampleNotifications)
    setUnreadCount(sampleNotifications.filter((n) => !n.read).length)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "chore":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "expense":
        return <DollarSign className="w-4 h-4 text-blue-500" />
      case "reminder":
        return <Calendar className="w-4 h-4 text-orange-500" />
      case "achievement":
        return <AlertCircle className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (time: string) => {
    const now = new Date()
    const notificationTime = new Date(time)
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 px-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <span className="text-xs text-muted-foreground ml-2">{formatTime(notification.time)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  {!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
