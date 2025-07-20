"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { VisualEffects } from "@/components/visual-effects"
import {
  AlertCircle,
  CheckCircle,
  Crown,
  Eye,
  EyeOff,
  Home,
  Key,
  Lock,
  Mail,
  Send,
  UserIcon,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AppUser {
  id: string
  name: string
  email: string
  password: string
  isAdmin: boolean
  avatar: string
  adminId?: string
  status: string
  requestedAt?: string
  joinedAt?: string
}

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [accountType, setAccountType] = useState<"admin" | "roommate">("admin")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  })
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [resetStep, setResetStep] = useState<"email" | "reset" | "success">("email")
  const [resetToken, setResetToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const user = registeredUsers.find((u: AppUser) => u.email === formData.email && u.password === formData.password)

      if (!user) {
        toast.error("Invalid email or password")
        return
      }

      if (user.status === "pending") {
        toast.error("Your account is pending approval from the admin")
        return
      }

      if (user.status === "rejected") {
        toast.error("Your account has been rejected. Please contact the admin.")
        return
      }

      // Set session start time
      localStorage.setItem("sessionStart", Date.now().toString())
      localStorage.setItem("currentUser", JSON.stringify(user))

      toast.success("Login successful!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (accountType === "roommate" && !formData.invitationCode) {
      toast.error("Please enter the invitation code")
      return
    }

    setIsLoading(true)

    try {
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

      // Check if email already exists
      const existingUser = registeredUsers.find((u: AppUser) => u.email === formData.email)
      if (existingUser) {
        toast.error("An account with this email already exists")
        return
      }

      let adminId = ""
      let status = "approved"

      if (accountType === "roommate") {
        // Find admin with matching invitation code
        const admin = registeredUsers.find((u: AppUser) => {
          if (!u.isAdmin) return false
          const adminData = localStorage.getItem(`choreboardData_${u.id}`)
          if (!adminData) return false
          try {
            const data = JSON.parse(adminData)
            // Ensure invitation code exists for this admin
            if (!data.invitationCode) {
              const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
              data.invitationCode = newCode
              localStorage.setItem(`choreboardData_${u.id}`, JSON.stringify(data))
            }
            return data.invitationCode === formData.invitationCode
          } catch (error) {
            console.error("Error parsing admin data:", error)
            return false
          }
        })

        if (!admin) {
          toast.error("Invalid invitation code. Please check with your admin for the correct code.")
          return
        }

        adminId = admin.id
        status = "pending" // Roommates need approval
      }

      const newUser: AppUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isAdmin: accountType === "admin",
        avatar: "",
        adminId: adminId || undefined,
        status,
        requestedAt: accountType === "roommate" ? new Date().toISOString() : undefined,
        joinedAt: accountType === "admin" ? new Date().toISOString() : undefined,
      }

      registeredUsers.push(newUser)
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers))

      if (accountType === "admin") {
        // Create initial data for admin
        const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const initialData = {
          chores: [],
          expenses: [],
          users: [newUser],
          invitationCode,
          pendingRequests: [],
          invitationRequests: [],
          recentActivity: [],
        }
        localStorage.setItem(`choreboardData_${newUser.id}`, JSON.stringify(initialData))

        // Set session and login
        localStorage.setItem("sessionStart", Date.now().toString())
        localStorage.setItem("currentUser", JSON.stringify(newUser))
        toast.success(`Admin account created successfully! Your invitation code is: ${invitationCode}`)
        router.push("/dashboard")
      } else {
        // Add to admin's pending requests
        const adminData = localStorage.getItem(`choreboardData_${adminId}`)
        if (adminData) {
          const data = JSON.parse(adminData)
          data.pendingRequests = data.pendingRequests || []
          data.pendingRequests.push(newUser)
          localStorage.setItem(`choreboardData_${adminId}`, JSON.stringify(data))
        }

        toast.success("Registration successful! Waiting for admin approval.")
        setIsLogin(true)
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        invitationCode: "",
      })
    } catch (error) {
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordEmail = async () => {
    if (!forgotPasswordData.email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)

    try {
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const user = registeredUsers.find((u: AppUser) => u.email === forgotPasswordData.email)

      if (user) {
        // User exists - send password reset link
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        setResetToken(token)

        // Store reset token with expiration (1 hour)
        const resetData = {
          email: forgotPasswordData.email,
          token,
          expires: Date.now() + 3600000, // 1 hour
        }
        localStorage.setItem(`passwordReset_${token}`, JSON.stringify(resetData))

        // Simulate sending email
        await simulateEmailSend(forgotPasswordData.email, "reset", token)

        toast.success("Password reset link sent to your email!")
        setResetStep("reset")
      } else {
        // User doesn't exist - show invitation option
        toast.error("Email not registered. Would you like to request an invitation?")

        // Show invitation request option
        const shouldRequestInvitation = window.confirm(
          "This email is not registered with ChoreBoard. Would you like to request an invitation from existing users?",
        )

        if (shouldRequestInvitation) {
          await handleInvitationRequest(forgotPasswordData.email)
        }
      }
    } catch (error) {
      toast.error("Failed to process request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvitationRequest = async (email: string) => {
    try {
      // Get all admin users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const admins = registeredUsers.filter((u: AppUser) => u.isAdmin)

      if (admins.length === 0) {
        toast.error("No administrators found to send invitation request")
        return
      }

      // Store invitation request
      const invitationRequest = {
        email,
        requestedAt: new Date().toISOString(),
        id: Date.now().toString(),
      }

      // Add to each admin's invitation requests
      for (const admin of admins) {
        const adminData = JSON.parse(localStorage.getItem(`choreboardData_${admin.id}`) || "{}")
        adminData.invitationRequests = adminData.invitationRequests || []
        adminData.invitationRequests.push(invitationRequest)
        localStorage.setItem(`choreboardData_${admin.id}`, JSON.stringify(adminData))

        // Simulate sending notification email to admin
        await simulateEmailSend(admin.email, "invitation_request", email)
      }

      toast.success("Invitation request sent to administrators!")
    } catch (error) {
      toast.error("Failed to send invitation request")
    }
  }

  const simulateEmailSend = async (email: string, type: "reset" | "invitation_request", data?: string) => {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (type === "reset") {
      console.log(`📧 Password Reset Email Sent to: ${email}`)
      console.log(`🔗 Reset Link: ${window.location.origin}/reset-password?token=${data}`)
      console.log(`⏰ Expires in 1 hour`)
    } else if (type === "invitation_request") {
      console.log(`📧 Invitation Request Email Sent to Admin`)
      console.log(`👤 Requested by: ${data}`)
      console.log(`📝 Message: Someone with email ${data} is requesting access to your ChoreBoard household`)
    }
  }

  const handlePasswordReset = async () => {
    if (!forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (forgotPasswordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      // Verify reset token
      const resetData = localStorage.getItem(`passwordReset_${resetToken}`)
      if (!resetData) {
        toast.error("Invalid or expired reset token")
        return
      }

      const { email, expires } = JSON.parse(resetData)
      if (Date.now() > expires) {
        toast.error("Reset token has expired. Please request a new one.")
        localStorage.removeItem(`passwordReset_${resetToken}`)
        return
      }

      // Update password
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const userIndex = registeredUsers.findIndex((u: AppUser) => u.email === email)

      if (userIndex === -1) {
        toast.error("User not found")
        return
      }

      registeredUsers[userIndex].password = forgotPasswordData.newPassword
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers))

      // Clean up reset token
      localStorage.removeItem(`passwordReset_${resetToken}`)

      toast.success("Password reset successfully!")
      setResetStep("success")

      // Auto close dialog after success
      setTimeout(() => {
        setShowForgotPassword(false)
        setResetStep("email")
        setForgotPasswordData({
          email: "",
          newPassword: "",
          confirmPassword: "",
        })
      }, 2000)
    } catch (error) {
      toast.error("Password reset failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForgotPasswordDialog = () => {
    setShowForgotPassword(false)
    setResetStep("email")
    setResetToken("")
    setForgotPasswordData({
      email: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative transition-all duration-500">
      <VisualEffects />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/40 bg-card/30 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white animate-bounce" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ChoreBoard
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16 animate-slide-in">
              <h2 className="text-5xl font-bold text-foreground mb-6">
                Manage Your Household
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Effortlessly
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Keep track of chores, split expenses, and coordinate with roommates all in one beautiful, intuitive
                platform.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center animate-bounce-in">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Chore Management</h3>
                  <p className="text-muted-foreground">
                    Assign, track, and complete household chores with priority levels and due dates.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center animate-bounce-in" style={{ animationDelay: "0.1s" }}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Expense Splitting</h3>
                  <p className="text-muted-foreground">
                    Track shared expenses and automatically calculate who owes what to whom.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center animate-bounce-in" style={{ animationDelay: "0.2s" }}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Roommate Coordination</h3>
                  <p className="text-muted-foreground">
                    Invite roommates, manage permissions, and keep everyone on the same page.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Auth Section */}
            <div className="max-w-md mx-auto">
              <Card className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
                  <CardDescription>
                    {isLogin
                      ? "Sign in to your ChoreBoard account"
                      : "Join ChoreBoard and start organizing your household"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isLogin && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Account Type</Label>
                        <RadioGroup
                          value={accountType}
                          onValueChange={(value) => setAccountType(value as "admin" | "roommate")}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="admin" />
                            <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer">
                              <Crown className="w-4 h-4 text-yellow-600" />
                              Admin (Create Household)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="roommate" id="roommate" />
                            <Label htmlFor="roommate" className="flex items-center gap-2 cursor-pointer">
                              <Users className="w-4 h-4 text-blue-600" />
                              Roommate (Join Existing)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {!isLogin && accountType === "roommate" && (
                    <div className="space-y-2">
                      <Label htmlFor="invitationCode">Invitation Code</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="invitationCode"
                          placeholder="Enter invitation code from admin"
                          value={formData.invitationCode}
                          onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value.toUpperCase() })}
                          className="pl-10 font-mono"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Get this code from your household admin</p>
                    </div>
                  )}

                  <Button
                    onClick={isLogin ? handleLogin : handleRegister}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  </Button>

                  {isLogin && (
                    <div className="text-center">
                      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-sm">
                            Forgot your password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              {resetStep === "email" && "Reset Password"}
                              {resetStep === "reset" && "Create New Password"}
                              {resetStep === "success" && "Password Reset Complete"}
                            </DialogTitle>
                            <DialogDescription>
                              {resetStep === "email" && "Enter your email address to receive a password reset link"}
                              {resetStep === "reset" && "Enter your new password below"}
                              {resetStep === "success" && "Your password has been successfully reset"}
                            </DialogDescription>
                          </DialogHeader>

                          {resetStep === "email" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="resetEmail">Email Address</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="resetEmail"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={forgotPasswordData.email}
                                    onChange={(e) =>
                                      setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })
                                    }
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  If your email is registered, you'll receive a reset link. If not, you can request an
                                  invitation to join ChoreBoard.
                                </AlertDescription>
                              </Alert>

                              <div className="flex gap-2">
                                <Button onClick={handleForgotPasswordEmail} disabled={isLoading} className="flex-1">
                                  <Send className="mr-2 h-4 w-4" />
                                  {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>
                                <Button variant="outline" onClick={resetForgotPasswordDialog}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {resetStep === "reset" && (
                            <div className="space-y-4">
                              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                  Reset link verified! Enter your new password below.
                                </AlertDescription>
                              </Alert>

                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={forgotPasswordData.newPassword}
                                    onChange={(e) =>
                                      setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value })
                                    }
                                    className="pl-10"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="confirmNewPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={forgotPasswordData.confirmPassword}
                                    onChange={(e) =>
                                      setForgotPasswordData({ ...forgotPasswordData, confirmPassword: e.target.value })
                                    }
                                    className="pl-10"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handlePasswordReset} disabled={isLoading} className="flex-1">
                                  {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                                <Button variant="outline" onClick={resetForgotPasswordDialog}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {resetStep === "success" && (
                            <div className="space-y-4 text-center">
                              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-muted-foreground">
                                Your password has been successfully reset. You can now sign in with your new password.
                              </p>
                              <Button onClick={resetForgotPasswordDialog} className="w-full">
                                Continue to Sign In
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <Separator />

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
                      {isLogin ? "Create one now" : "Sign in instead"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Copyright Footer */}
              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>© 2025 ChoreBoard. Making shared living harmonious with beautiful design.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
