"use client"

import { AppHeader } from "@/components/app-header"
import { AppNavigation } from "@/components/app-navigation"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VisualEffects } from "@/components/visual-effects"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  CalendarIcon,
  CreditCard,
  DollarSign,
  Edit,
  Filter,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Expense {
  id: string
  title: string
  description: string
  amount: number
  category: string
  paidBy: string
  splitBetween: string[]
  date: string
  receipt?: string
  createdAt: string
  isRecurring?: boolean
  recurringType?: "monthly" | "weekly" | "yearly"
}

interface ChoreboardData {
  chores: any[]
  expenses: Expense[]
  users: any[]
}

export default function ExpensesPage() {
  const [user, setUser] = useState<any | null>(null)
  const [data, setData] = useState<ChoreboardData>({ chores: [], expenses: [], users: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: 0,
    category: "general",
    paidBy: "",
    splitBetween: [] as string[],
    date: new Date(),
    isRecurring: false,
    recurringType: "monthly" as "monthly" | "weekly" | "yearly",
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

    // Load user's data
    const userDataKey = userData.isAdmin ? `choreboardData_${userData.id}` : `choreboardData_${userData.adminId}`
    const choreboardData = localStorage.getItem(userDataKey)
    if (choreboardData) {
      const parsedData = JSON.parse(choreboardData)
      setData(parsedData)
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

  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.paidBy || newExpense.amount <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title,
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      paidBy: newExpense.paidBy,
      splitBetween: newExpense.splitBetween.length > 0 ? newExpense.splitBetween : [newExpense.paidBy],
      date: newExpense.date.toISOString(),
      createdAt: new Date().toISOString(),
      isRecurring: newExpense.isRecurring,
      recurringType: newExpense.isRecurring ? newExpense.recurringType : undefined,
    }

    const newData = {
      ...data,
      expenses: [...data.expenses, expense],
    }

    saveData(newData)
    setNewExpense({
      title: "",
      description: "",
      amount: 0,
      category: "general",
      paidBy: "",
      splitBetween: [],
      date: new Date(),
      isRecurring: false,
      recurringType: "monthly",
    })
    setIsDialogOpen(false)
    toast.success("Expense added successfully!")
  }

  const handleEditExpense = () => {
    if (!editingExpense || !editingExpense.title || !editingExpense.paidBy || editingExpense.amount <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    const newData = {
      ...data,
      expenses: data.expenses.map((expense) => (expense.id === editingExpense.id ? editingExpense : expense)),
    }

    saveData(newData)
    setEditingExpense(null)
    toast.success("Expense updated successfully!")
  }

  const handleDeleteExpense = (expenseId: string) => {
    const newData = {
      ...data,
      expenses: data.expenses.filter((expense) => expense.id !== expenseId),
    }

    saveData(newData)
    toast.success("Expense deleted successfully!")
  }

  const filteredExpenses = data.expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || expense.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const getUserName = (userId: string) => {
    const user = data.users.find((u: any) => u.id === userId)
    return user ? user.name : "Unknown User"
  }

  const getTotalExpenses = () => {
    return data.expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return data.expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getUserExpenses = (userId: string) => {
    return data.expenses
      .filter((expense) => expense.paidBy === userId)
      .reduce((total, expense) => total + expense.amount, 0)
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

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8 animate-slide-in">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Household Expenses</h2>
                <p className="text-muted-foreground">Track and manage your shared expenses</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>Record a new household expense and split it among members.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter expense title"
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter expense description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpense.amount || ""}
                          onChange={(e) =>
                            setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="groceries">Groceries</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Paid By *</Label>
                        <Select
                          value={newExpense.paidBy}
                          onValueChange={(value) => setNewExpense({ ...newExpense, paidBy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newExpense.date && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newExpense.date ? format(newExpense.date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newExpense.date}
                              onSelect={(date) => date && setNewExpense({ ...newExpense, date: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddExpense} className="flex-1">
                        Add Expense
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="animate-slide-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold">${getTotalExpenses().toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">${getMonthlyExpenses().toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Your Expenses</p>
                      <p className="text-2xl font-bold">${getUserExpenses(user.id).toFixed(2)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6 animate-slide-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="groceries">Groceries</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses List */}
            <div className="space-y-4">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, index) => (
                  <Card
                    key={expense.id}
                    className="transition-all duration-300 hover:shadow-lg animate-bounce-in"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{expense.title}</h3>
                              <Badge variant="outline">{expense.category}</Badge>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ${expense.amount.toFixed(2)}
                              </Badge>
                            </div>

                            {expense.description && <p className="text-muted-foreground mb-3">{expense.description}</p>}

                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>Paid by: {getUserName(expense.paidBy)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {expense.splitBetween && expense.splitBetween.length > 1 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <span>Split between: {expense.splitBetween.map(getUserName).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {user.isAdmin && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setEditingExpense(expense)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Edit Expense</DialogTitle>
                                    <DialogDescription>Update the expense details.</DialogDescription>
                                  </DialogHeader>
                                  {editingExpense && (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-title">Title *</Label>
                                        <Input
                                          id="edit-title"
                                          value={editingExpense.title}
                                          onChange={(e) =>
                                            setEditingExpense({ ...editingExpense, title: e.target.value })
                                          }
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="edit-amount">Amount *</Label>
                                        <Input
                                          id="edit-amount"
                                          type="number"
                                          step="0.01"
                                          value={editingExpense.amount}
                                          onChange={(e) =>
                                            setEditingExpense({
                                              ...editingExpense,
                                              amount: Number.parseFloat(e.target.value) || 0,
                                            })
                                          }
                                        />
                                      </div>

                                      <div className="flex gap-2 pt-4">
                                        <Button onClick={handleEditExpense} className="flex-1">
                                          Update Expense
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingExpense(null)}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="animate-slide-in">
                  <CardContent className="p-12 text-center">
                    <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No expenses found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || filterCategory !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Get started by adding your first household expense"}
                    </p>
                    {!searchTerm && filterCategory === "all" && (
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Expense
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
