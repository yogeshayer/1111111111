"use client"

import { AppHeader } from "@/components/app-header"
import { AppNavigation } from "@/components/app-navigation"
import { HouseholdAlerts } from "@/components/household-alerts"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VisualEffects } from "@/components/visual-effects"
import {
  AlertTriangle,
  Award,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  avatar: string
  adminId?: string
  status: string
  joinedAt?: string
}

interface Chore {
  id: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  completedAt?: string
  completedBy?: string
  createdAt: string
}

interface Expense {
  id: string
  title: string
  amount: number
  paidBy: string
  category: string
  date: string
  splitBetween: string[]
  description: string
  settled: boolean
  settledAt?: string
  settledBy?: string
}

interface MissedTask {
  id: string
  choreId: string
  choreTitle: string
  assignedTo: string
  dueDate: string
  missedDate: string
  priority: "low" | "medium" | "high"
  category: string
}

interface ChoreboardData {
  chores: Chore[]
  expenses: Expense[]
  users: User[]
  invitationCode?: string
  pendingRequests?: any[]
  missedTasks?: MissedTask[]
  householdAlerts?: any[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<ChoreboardData>({ chores: [], expenses: [], users: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [showPendingRequests, setShowPendingRequests] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Load data based on user type
    const userDataKey = userData.isAdmin ? `choreboardData_${userData.id}` : `choreboardData_${userData.adminId}`
    const choreboardData = localStorage.getItem(userDataKey)
    if (choreboardData) {
      const parsedData = JSON.parse(choreboardData)

      // Initialize missing properties
      if (!parsedData.missedTasks) {
        parsedData.missedTasks = []
      }
      if (!parsedData.householdAlerts) {
        parsedData.householdAlerts = []
      }

      setData(parsedData)

      // Load pending requests for admin
      if (userData.isAdmin) {
        const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
        const pendingRequests = registeredUsers.filter((u: any) => u.adminId === userData.id && u.status === "pending")
        setData((prev) => ({ ...prev, pendingRequests }))
      }
    }

    setIsLoading(false)
  }, [router])

  const saveData = (newData: ChoreboardData) => {
    if (!user) return
    const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
    localStorage.setItem(userDataKey, JSON.stringify(newData))
    localStorage.setItem("choreboardData", JSON.stringify(newData))
    setData(newData)
  }

  const handleApproveRequest = (requestId: string) => {
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const updatedUsers = registeredUsers.map((u: any) => (u.id === requestId ? { ...u, status: "approved" } : u))
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))

    // Add user to household
    const approvedUser = updatedUsers.find((u: any) => u.id === requestId)
    if (approvedUser) {
      const newData = {
        ...data,
        users: [...data.users, approvedUser],
        pendingRequests: data.pendingRequests?.filter((req) => req.id !== requestId) || [],
      }
      saveData(newData)
      toast.success(`${approvedUser.name} has been approved and added to your household!`)
    }
  }

  const handleRejectRequest = (requestId: string) => {
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const rejectedUser = registeredUsers.find((u: any) => u.id === requestId)
    const updatedUsers = registeredUsers.filter((u: any) => u.id !== requestId)
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))

    const newData = {
      ...data,
      pendingRequests: data.pendingRequests?.filter((req) => req.id !== requestId) || [],
    }
    setData(newData)
    toast.success(`Request from ${rejectedUser?.name} has been rejected`)
  }

  const handleDismissMissedTask = (taskId: string) => {
    const newData = {
      ...data,
      missedTasks: data.missedTasks?.filter((task) => task.id !== taskId) || [],
    }
    saveData(newData)
    toast.success("Missed task dismissed")
  }

  // Calculate statistics
  const totalChores = data.chores.length
  const completedChores = data.chores.filter((chore) => chore.completed).length
  const choreCompletionRate = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0

  const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const settledExpenses = data.expenses.filter((expense) => expense.settled).length
  const expenseSettlementRate =
    data.expenses.length > 0 ? Math.round((settledExpenses / data.expenses.length) * 100) : 0

  const myChores = data.chores.filter((chore) => chore.assignedTo === user?.id && !chore.completed)
  const overdueChores = data.chores.filter((chore) => !chore.completed && new Date(chore.dueDate) < new Date())
  const myOverdueChores = overdueChores.filter((chore) => chore.assignedTo === user?.id)

  const myExpenses = data.expenses.filter(
    (expense) => expense.splitBetween.includes(user?.id || "") && !expense.settled,
  )
  const myOwedAmount = myExpenses.reduce((sum, expense) => {
    if (expense.paidBy === user?.id) return sum
    return sum + expense.amount / expense.splitBetween.length
  }, 0)

  const getUserName = (userId: string) => {
    const foundUser = data.users.find((u) => u.id === userId)
    return foundUser ? foundUser.name : "Unknown User"
  }

  const getTopPerformer = () => {
    const userStats = data.users.map((user) => {
      const userChores = data.chores.filter((chore) => chore.assignedTo === user.id)
      const completedUserChores = userChores.filter((chore) => chore.completed)
      const completionRate = userChores.length > 0 ? (completedUserChores.length / userChores.length) * 100 : 0
      return { user, completionRate, completedCount: completedUserChores.length }
    })

    return userStats.reduce((top, current) => {
      if (current.completedCount > top.completedCount) return current
      if (current.completedCount === top.completedCount && current.completionRate > top.completionRate) return current
      return top
    }, userStats[0])
  }

  const topPerformer = data.users.length > 0 ? getTopPerformer() : null

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

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {/* Maintain spacing where welcome section was - empty div with same height */}
            <div className="mb-8 h-16"></div>

            {/* Pending Requests Alert (Admin Only) */}
            {user.isAdmin && data.pendingRequests && data.pendingRequests.length > 0 && (
              <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10 animate-slide-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <div>
                        <h3 className="font-medium text-orange-800 dark:text-orange-200">Pending Join Requests</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {data.pendingRequests.length} user(s) want to join your household
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPendingRequests(!showPendingRequests)}
                        className="border-orange-200 text-orange-700 hover:bg-orange-100"
                      >
                        {showPendingRequests ? "Hide" : "Review"}
                      </Button>
                    </div>
                  </div>

                  {showPendingRequests && (
                    <div className="mt-4 space-y-3">
                      {data.pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{request.name}</p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Missed Tasks Alert */}
            {data.missedTasks && data.missedTasks.length > 0 && (
              <Card className="mb-6 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10 animate-slide-in">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-200">Missed Tasks Alert</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {data.missedTasks.length} task(s) were not completed on time
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.missedTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                      >
                        <div>
                          <p className="font-medium text-sm">{task.choreTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Assigned to {getUserName(task.assignedTo)} • Due:{" "}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissMissedTask(task.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {data.missedTasks.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        And {data.missedTasks.length - 3} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card
                className="animate-slide-in transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                style={{ animationDelay: "0.1s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Chores</p>
                      <p className="text-2xl font-bold text-foreground">{totalChores}</p>
                      <p className="text-xs text-muted-foreground">{completedChores} completed</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={choreCompletionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{choreCompletionRate}% completion rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-slide-in transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                style={{ animationDelay: "0.2s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{settledExpenses} settled</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={expenseSettlementRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{expenseSettlementRate}% settlement rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-slide-in transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                style={{ animationDelay: "0.3s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Household Members</p>
                      <p className="text-2xl font-bold text-foreground">{data.users.length}</p>
                      <p className="text-xs text-muted-foreground">Active members</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex -space-x-2">
                      {data.users.slice(0, 4).map((member, index) => (
                        <div
                          key={member.id}
                          className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium transform hover:scale-110 transition-transform duration-200"
                          title={member.name}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {data.users.length > 4 && (
                        <div className="w-6 h-6 bg-muted rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium">
                          +{data.users.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-slide-in transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                style={{ animationDelay: "0.4s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">My Tasks</p>
                      <p className="text-2xl font-bold text-foreground">{myChores.length}</p>
                      <p className="text-xs text-muted-foreground">{myOverdueChores.length} overdue</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                      <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {myOverdueChores.length > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {myOverdueChores.length} overdue
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        All up to date
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* My Tasks */}
                <Card
                  className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: "0.5s" }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          My Tasks
                        </CardTitle>
                        <CardDescription>Your assigned chores and upcoming deadlines</CardDescription>
                      </div>
                      <Link href="/chores">
                        <Button
                          variant="outline"
                          size="sm"
                          className="transform hover:scale-105 transition-transform duration-200 bg-transparent"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myChores.length > 0 ? (
                      <div className="space-y-3">
                        {myChores.slice(0, 5).map((chore) => (
                          <div
                            key={chore.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transform hover:scale-[1.02] transition-all duration-200 ${
                              new Date(chore.dueDate) < new Date()
                                ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                                : "bg-muted/50 hover:bg-muted/70"
                            }`}
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{chore.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    chore.priority === "high"
                                      ? "destructive"
                                      : chore.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {chore.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Due: {new Date(chore.dueDate).toLocaleDateString()}
                                </span>
                                {new Date(chore.dueDate) < new Date() && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {myChores.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            And {myChores.length - 5} more tasks...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 animate-bounce" />
                        <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
                        <p className="text-muted-foreground">You have no pending tasks</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Expenses */}
                <Card
                  className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: "0.6s" }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          Recent Expenses
                        </CardTitle>
                        <CardDescription>Latest household expenses and your share</CardDescription>
                      </div>
                      <Link href="/expenses">
                        <Button
                          variant="outline"
                          size="sm"
                          className="transform hover:scale-105 transition-transform duration-200 bg-transparent"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {data.expenses.length > 0 ? (
                      <div className="space-y-3">
                        {data.expenses
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transform hover:scale-[1.02] transition-all duration-200"
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{expense.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Paid by {getUserName(expense.paidBy)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(expense.date).toLocaleDateString()}
                                  </span>
                                  {expense.settled && (
                                    <Badge variant="secondary" className="text-xs">
                                      Settled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">${expense.amount.toFixed(2)}</p>
                                {expense.splitBetween.includes(user.id) && (
                                  <p className="text-xs text-muted-foreground">
                                    Your share: ${(expense.amount / expense.splitBetween.length).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        {data.expenses.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            And {data.expenses.length - 5} more expenses...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-bounce" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No expenses yet</h3>
                        <p className="text-muted-foreground mb-4">Start tracking your household expenses</p>
                        <Link href="/expenses">
                          <Button className="transform hover:scale-105 transition-transform duration-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Expense
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Household Alerts */}
                <HouseholdAlerts user={user} data={data} onDataUpdate={saveData} />
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <Card
                  className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: "0.7s" }}
                >
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/chores">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent transform hover:scale-105 transition-all duration-200 hover:shadow-md"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Chore
                      </Button>
                    </Link>
                    <Link href="/expenses">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent transform hover:scale-105 transition-all duration-200 hover:shadow-md"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Record Expense
                      </Button>
                    </Link>
                    <Link href="/roommates">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent transform hover:scale-105 transition-all duration-200 hover:shadow-md"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Roommates
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Top Performer */}
                {topPerformer && (
                  <Card
                    className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: "0.8s" }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600 animate-pulse" />
                        Top Performer
                      </CardTitle>
                      <CardDescription>This week's household champion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-full flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                          <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{topPerformer.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{topPerformer.completedCount} tasks completed</p>
                          <div className="mt-2">
                            <Progress value={topPerformer.completionRate} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(topPerformer.completionRate)}% completion rate
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* My Financial Summary */}
                {myOwedAmount > 0 && (
                  <Card
                    className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: "0.9s" }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                        My Financial Summary
                      </CardTitle>
                      <CardDescription>Your current expense obligations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Amount Owed:</span>
                          <span className="font-medium text-red-600">${myOwedAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Unsettled Expenses:</span>
                          <span className="font-medium">{myExpenses.length}</span>
                        </div>
                        <Link href="/expenses">
                          <Button
                            size="sm"
                            className="w-full mt-3 transform hover:scale-105 transition-transform duration-200"
                          >
                            Settle Expenses
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Deadlines */}
                <Card
                  className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: "1.0s" }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Upcoming Deadlines
                    </CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const upcomingTasks = data.chores.filter((chore) => {
                        if (chore.completed) return false
                        const dueDate = new Date(chore.dueDate)
                        const today = new Date()
                        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                        return dueDate >= today && dueDate <= nextWeek
                      })

                      return upcomingTasks.length > 0 ? (
                        <div className="space-y-2">
                          {upcomingTasks.slice(0, 5).map((chore) => (
                            <div
                              key={chore.id}
                              className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50 transition-colors duration-200"
                            >
                              <span className="truncate">{chore.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(chore.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {upcomingTasks.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{upcomingTasks.length - 5} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
