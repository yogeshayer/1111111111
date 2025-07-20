"use client"

import { AppHeader } from "@/components/app-header"
import { AppNavigation } from "@/components/app-navigation"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { VisualEffects } from "@/components/visual-effects"
import { Bell, Eye, EyeOff, Shield, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface NotificationSettings {
  choreReminders: boolean
  expenseAlerts: boolean
  weeklyReports: boolean
  systemUpdates: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    choreReminders: true,
    expenseAlerts: true,
    weeklyReports: false,
    systemUpdates: true,
  })
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)
    setProfileData({
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || "",
    })

    // Load notification settings
    const savedNotifications = localStorage.getItem(`notifications_${userData.id}`)
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }

    setIsLoading(false)
  }, [router])

  const handleProfileUpdate = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Update user data
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar,
      }

      // Update in localStorage
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update in registered users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedRegisteredUsers = registeredUsers.map((u: any) => (u.id === user.id ? updatedUser : u))
      localStorage.setItem("registeredUsers", JSON.stringify(updatedRegisteredUsers))

      // Update in household data
      const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
      const choreboardData = localStorage.getItem(userDataKey)
      if (choreboardData) {
        const data = JSON.parse(choreboardData)
        data.users = data.users.map((u: any) => (u.id === user.id ? updatedUser : u))
        localStorage.setItem(userDataKey, JSON.stringify(data))
      }

      setUser(updatedUser)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    // Verify current password
    if (passwordData.currentPassword !== user.password) {
      toast.error("Current password is incorrect")
      return
    }

    setIsSaving(true)
    try {
      // Update user password
      const updatedUser = {
        ...user,
        password: passwordData.newPassword,
      }

      // Update in localStorage
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update in registered users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedRegisteredUsers = registeredUsers.map((u: any) => (u.id === user.id ? updatedUser : u))
      localStorage.setItem("registeredUsers", JSON.stringify(updatedRegisteredUsers))

      // Update in household data
      const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
      const choreboardData = localStorage.getItem(userDataKey)
      if (choreboardData) {
        const data = JSON.parse(choreboardData)
        data.users = data.users.map((u: any) => (u.id === user.id ? updatedUser : u))
        localStorage.setItem(userDataKey, JSON.stringify(data))
      }

      setUser(updatedUser)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast.success("Password changed successfully!")
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationUpdate = (key: keyof NotificationSettings, value: boolean) => {
    if (!user) return

    const updatedNotifications = {
      ...notifications,
      [key]: value,
    }

    setNotifications(updatedNotifications)
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications))
    toast.success("Notification settings updated!")
  }

  if (isLoading) {
    return (
      <SessionTimeoutProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </SessionTimeoutProvider>
    )
  }

  if (!user) return null

  return (
    <SessionTimeoutProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative transition-all duration-500">
        <VisualEffects />

        <div className="relative z-10">
          <AppHeader />
          <AppNavigation />

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="animate-slide-in">
                <h2 className="text-3xl font-bold text-foreground">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences</p>
              </div>

              {/* Profile Settings */}
              <Card className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
                        {profileData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {user.isAdmin && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL (Optional)</Label>
                    <Input
                      id="avatar"
                      value={profileData.avatar}
                      onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                      placeholder="Enter avatar image URL"
                    />
                  </div>

                  <Button onClick={handleProfileUpdate} disabled={isSaving} className="w-full md:w-auto">
                    {isSaving ? "Updating..." : "Update Profile"}
                  </Button>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>At least 6 characters long</li>
                      <li>New password must be different from current password</li>
                    </ul>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isSaving} className="w-full md:w-auto">
                    {isSaving ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Chore Reminders</Label>
                        <p className="text-sm text-muted-foreground">Get notified about upcoming and overdue chores</p>
                      </div>
                      <Switch
                        checked={notifications.choreReminders}
                        onCheckedChange={(checked) => handleNotificationUpdate("choreReminders", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Expense Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified about new expenses and payments</p>
                      </div>
                      <Switch
                        checked={notifications.expenseAlerts}
                        onCheckedChange={(checked) => handleNotificationUpdate("expenseAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly household activity summaries</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => handleNotificationUpdate("weeklyReports", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about app updates and maintenance</p>
                      </div>
                      <Switch
                        checked={notifications.systemUpdates}
                        onCheckedChange={(checked) => handleNotificationUpdate("systemUpdates", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
