"use client"

import { AppHeader } from "@/components/app-header"
import { AppNavigation } from "@/components/app-navigation"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VisualEffects } from "@/components/visual-effects"
import { Calendar, Clock, Copy, Crown, Key, Mail, MoreHorizontal, Send, UserCheck, Users, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AppUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  adminId?: string
  status: string
  requestedAt?: string
  joinedAt?: string
}

interface InvitationRequest {
  id: string
  email: string
  requestedAt: string
}

export default function RoommatesPage() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [pendingRequests, setPendingRequests] = useState<AppUser[]>([])
  const [invitationRequests, setInvitationRequests] = useState<InvitationRequest[]>([])
  const [invitationCode, setInvitationCode] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [userToRemove, setUserToRemove] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (!user) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(user)
    setCurrentUser(parsedUser)

    if (!parsedUser.isAdmin) {
      toast.error("Access denied. Admin privileges required.")
      router.push("/dashboard")
      return
    }

    loadRoommates(parsedUser)
  }, [router])

  const loadRoommates = (user: AppUser) => {
    try {
      const data = localStorage.getItem(`choreboardData_${user.id}`)
      if (data) {
        const parsedData = JSON.parse(data)
        setUsers(parsedData.users || [])
        setPendingRequests(parsedData.pendingRequests || [])
        setInvitationRequests(parsedData.invitationRequests || [])

        // Ensure invitation code exists
        if (!parsedData.invitationCode) {
          const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
          parsedData.invitationCode = newCode
          localStorage.setItem(`choreboardData_${user.id}`, JSON.stringify(parsedData))
          console.log(`Generated new invitation code for admin ${user.name}: ${newCode}`)
        }
        setInvitationCode(parsedData.invitationCode)
      } else {
        // If no data exists, create initial data with invitation code
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const initialData = {
          chores: [],
          expenses: [],
          users: [user],
          invitationCode: newCode,
          pendingRequests: [],
          invitationRequests: [],
          recentActivity: [],
        }
        localStorage.setItem(`choreboardData_${user.id}`, JSON.stringify(initialData))
        setInvitationCode(newCode)
        setUsers([user])
        console.log(`Created initial data with invitation code for admin ${user.name}: ${newCode}`)
      }
    } catch (error) {
      console.error("Error loading roommates:", error)
      toast.error("Failed to load roommate data")
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = (updatedData: any) => {
    if (!currentUser) return

    try {
      localStorage.setItem(`choreboardData_${currentUser.id}`, JSON.stringify(updatedData))
    } catch (error) {
      console.error("Error saving data:", error)
      toast.error("Failed to save changes")
    }
  }

  const addRecentActivity = (description: string) => {
    if (!currentUser) return

    try {
      const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser.id}`) || "{}")
      data.recentActivity = data.recentActivity || []

      data.recentActivity.unshift({
        id: Date.now().toString(),
        description,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
      })

      // Keep only last 50 activities
      data.recentActivity = data.recentActivity.slice(0, 50)

      localStorage.setItem(`choreboardData_${currentUser.id}`, JSON.stringify(data))
    } catch (error) {
      console.error("Error adding recent activity:", error)
    }
  }

  const approveUser = (userId: string) => {
    const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")
    const userToApprove = data.pendingRequests.find((u) => u.id === userId)

    if (!userToApprove) return

    // Update user status in registered users
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const updatedRegisteredUsers = registeredUsers.map((u: AppUser) =>
      u.id === userId ? { ...u, status: "approved", joinedAt: new Date().toISOString() } : u,
    )
    localStorage.setItem("registeredUsers", JSON.stringify(updatedRegisteredUsers))

    // Move from pending to approved users
    const approvedUser = { ...userToApprove, status: "approved", joinedAt: new Date().toISOString() }
    data.users = [...(data.users || []), approvedUser]
    data.pendingRequests = (data.pendingRequests || []).filter((u: AppUser) => u.id !== userId)

    saveData(data)
    setUsers(data.users)
    setPendingRequests(data.pendingRequests)

    addRecentActivity(`${userToApprove.name} was approved and joined the household`)
    toast.success(`${userToApprove.name} has been approved!`)
  }

  const rejectUser = (userId: string) => {
    const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")
    const userToReject = data.pendingRequests.find((u) => u.id === userId)

    if (!userToReject) return

    // Update user status in registered users
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const updatedRegisteredUsers = registeredUsers.map((u: AppUser) =>
      u.id === userId ? { ...u, status: "rejected" } : u,
    )
    localStorage.setItem("registeredUsers", JSON.stringify(updatedRegisteredUsers))

    // Remove from pending requests
    data.pendingRequests = (data.pendingRequests || []).filter((u: AppUser) => u.id !== userId)

    saveData(data)
    setPendingRequests(data.pendingRequests)

    addRecentActivity(`${userToReject.name}'s request to join was rejected`)
    toast.success(`${userToReject.name}'s request has been rejected`)
  }

  const removeUser = (userId: string) => {
    if (!userToRemove) return

    const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")

    // Remove from household users
    data.users = (data.users || []).filter((u: AppUser) => u.id !== userId)

    // Update registered users status
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const updatedRegisteredUsers = registeredUsers.filter((u: AppUser) => u.id !== userId)
    localStorage.setItem("registeredUsers", JSON.stringify(updatedRegisteredUsers))

    saveData(data)
    setUsers(data.users)
    setUserToRemove(null)

    addRecentActivity(`${userToRemove.name} was removed from the household`)
    toast.success(`${userToRemove.name} has been removed`)
  }

  const sendInvitation = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address")
      return
    }

    try {
      // Simulate sending invitation email
      await simulateEmailSend(inviteEmail, "invitation", invitationCode)

      const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")
      data.sentInvitations = data.sentInvitations || []
      data.sentInvitations.push({
        email: inviteEmail,
        sentAt: new Date().toISOString(),
        code: invitationCode,
      })

      saveData(data)
      addRecentActivity(`Invitation sent to ${inviteEmail}`)

      setIsInviteDialogOpen(false)
      setInviteEmail("")
      toast.success("Invitation sent successfully!")
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  const simulateEmailSend = async (email: string, type: "invitation", code: string) => {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`📧 Invitation Email Sent to: ${email}`)
    console.log(`🔑 Invitation Code: ${code}`)
    console.log(`🔗 Join Link: ${window.location.origin}/?invite=${code}`)
  }

  const copyInvitationCode = () => {
    navigator.clipboard.writeText(invitationCode)
    toast.success("Invitation code copied to clipboard!")
  }

  const regenerateInvitationCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")
    data.invitationCode = newCode
    saveData(data)
    setInvitationCode(newCode)
    addRecentActivity("Invitation code was regenerated")
    toast.success("New invitation code generated!")
  }

  const respondToInvitationRequest = (requestId: string, email: string, approve: boolean) => {
    const data = JSON.parse(localStorage.getItem(`choreboardData_${currentUser!.id}`) || "{}")

    if (approve) {
      // Send invitation
      simulateEmailSend(email, "invitation", invitationCode)
      addRecentActivity(`Invitation sent to ${email} (requested access)`)
      toast.success(`Invitation sent to ${email}!`)
    } else {
      addRecentActivity(`Invitation request from ${email} was declined`)
      toast.success("Invitation request declined")
    }

    // Remove from invitation requests
    data.invitationRequests = (data.invitationRequests || []).filter((req: InvitationRequest) => req.id !== requestId)
    saveData(data)
    setInvitationRequests(data.invitationRequests)
  }

  const debugInvitationCode = () => {
    console.log("=== INVITATION CODE DEBUG ===")
    console.log("Current invitation code:", invitationCode)

    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const admins = registeredUsers.filter((u: AppUser) => u.isAdmin)

    console.log("All admins and their invitation codes:")
    admins.forEach((admin) => {
      const adminData = localStorage.getItem(`choreboardData_${admin.id}`)
      if (adminData) {
        const data = JSON.parse(adminData)
        console.log(`Admin ${admin.name} (${admin.email}): ${data.invitationCode || "NO CODE"}`)
      } else {
        console.log(`Admin ${admin.name} (${admin.email}): NO DATA`)
      }
    })
    console.log("=== END DEBUG ===")
  }

  if (isLoading) {
    return (
      <SessionTimeoutProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative transition-all duration-500">
          <VisualEffects />
          <div className="relative z-10">
            <AppHeader />
            <AppNavigation />
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading roommates...</p>
              </div>
            </div>
          </div>
        </div>
      </SessionTimeoutProvider>
    )
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null
  }

  return (
    <SessionTimeoutProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative transition-all duration-500">
        <VisualEffects />

        <div className="relative z-10">
          <AppHeader />
          <AppNavigation />

          <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Roommates</h1>
                  <p className="text-muted-foreground">Manage your household members</p>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                    <DialogHeader>
                      <DialogTitle>Send Invitation</DialogTitle>
                      <DialogDescription>Invite someone to join your household</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={sendInvitation} className="flex-1">
                          Send Invitation
                        </Button>
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Invitation Code Card */}
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Invitation Code
                  </CardTitle>
                  <CardDescription>Share this code with people you want to invite</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-2xl font-mono font-bold bg-muted p-3 rounded-lg text-center">
                        {invitationCode}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={copyInvitationCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={regenerateInvitationCode}>
                        Regenerate
                      </Button>
                      <Button variant="ghost" size="sm" onClick={debugInvitationCode} className="text-xs">
                        Debug
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invitation Requests */}
              {invitationRequests.length > 0 && (
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Invitation Requests
                    </CardTitle>
                    <CardDescription>People requesting to join your household</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invitationRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{request.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => respondToInvitationRequest(request.id, request.email, true)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send Invite
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => respondToInvitationRequest(request.id, request.email, false)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription>Roommate requests waiting for your approval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingRequests.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Requested{" "}
                                {user.requestedAt ? new Date(user.requestedAt).toLocaleDateString() : "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => rejectUser(user.id)}>
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Roommates */}
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Roommates ({users.length})
                  </CardTitle>
                  <CardDescription>Active members of your household</CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No roommates yet</h3>
                      <p className="text-muted-foreground mb-4">Invite people to join your household</p>
                      <Button onClick={() => setIsInviteDialogOpen(true)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send First Invitation
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map((user) => (
                        <Card key={user.id} className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{user.name}</p>
                                    {user.isAdmin && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                      >
                                        <Crown className="h-3 w-3 mr-1" />
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {!user.isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setUserToRemove(user)} className="text-red-600">
                                      <UserX className="h-4 w-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Remove User Confirmation Dialog */}
              <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
                <AlertDialogContent className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Roommate</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {userToRemove?.name} from your household? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeUser(userToRemove?.id || "")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
