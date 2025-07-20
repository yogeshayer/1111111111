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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { VisualEffects } from "@/components/visual-effects"
import { cn } from "@/lib/utils"
import { addDays, addMonths, addWeeks, format } from "date-fns"
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  Filter,
  Plus,
  Repeat,
  Search,
  Trash2,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
  isRecurring?: boolean
  recurringType?: "daily" | "weekly" | "monthly" | "custom"
  recurringInterval?: number
  nextDueDate?: string
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
  expenses: any[]
  users: any[]
  missedTasks?: MissedTask[]
}

export default function ChoresPage() {
  const [user, setUser] = useState<any | null>(null)
  const [data, setData] = useState<ChoreboardData>({ chores: [], expenses: [], users: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [newChore, setNewChore] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: new Date(),
    priority: "medium" as "low" | "medium" | "high",
    category: "general",
    isRecurring: false,
    recurringType: "weekly" as "daily" | "weekly" | "monthly" | "custom",
    recurringInterval: 1,
  })
  const router = useRouter()
  const [externalTasks, setExternalTasks] = useState<{ title: string; completed: boolean }[]>([]);

  const fetchExternalTasks = async () => {
    const res = await fetch("http://localhost:3000/tasks");
    const data = await res.json();
    setExternalTasks(data);
  };

  useEffect(() => {
    fetchExternalTasks();
  }, []);

  const handleMongoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("taskTitle") as HTMLInputElement;
    const title = input.value;
    if (!title) return;

    await fetch("http://localhost:3000/add-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, completed: false }),
    });

    input.value = "";
    fetchExternalTasks();
  };


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
      // Initialize missedTasks if it doesn't exist
      if (!parsedData.missedTasks) {
        parsedData.missedTasks = []
      }
      setData(parsedData)

      // Check for overdue tasks and add to missed tasks
      checkOverdueTasks(parsedData, userData)

      // Check for recurring chores that need to be recreated
      checkRecurringChores(parsedData, userData)
    }

    setIsLoading(false)
  }, [router])

  const checkOverdueTasks = (currentData: ChoreboardData, currentUser: any) => {
    const now = new Date()
    const overdueTasks: MissedTask[] = []

    currentData.chores.forEach((chore) => {
      const dueDate = new Date(chore.dueDate)
      const isOverdue = !chore.completed && dueDate < now

      if (isOverdue) {
        // Check if this missed task already exists
        const existingMissedTask = currentData.missedTasks?.find((missed) => missed.choreId === chore.id)

        if (!existingMissedTask) {
          const missedTask: MissedTask = {
            id: `missed_${chore.id}_${Date.now()}`,
            choreId: chore.id,
            choreTitle: chore.title,
            assignedTo: chore.assignedTo,
            dueDate: chore.dueDate,
            missedDate: now.toISOString(),
            priority: chore.priority,
            category: chore.category,
          }
          overdueTasks.push(missedTask)
        }
      }
    })

    if (overdueTasks.length > 0) {
      const updatedData = {
        ...currentData,
        missedTasks: [...(currentData.missedTasks || []), ...overdueTasks],
      }
      saveData(updatedData)
    }
  }

  const checkRecurringChores = (currentData: ChoreboardData, currentUser: any) => {
    const now = new Date()
    const newChores: Chore[] = []

    currentData.chores.forEach((chore) => {
      if (chore.isRecurring && chore.completed && chore.nextDueDate) {
        const nextDueDate = new Date(chore.nextDueDate)

        // If the next due date has passed, create a new instance
        if (nextDueDate <= now) {
          const newChore: Chore = {
            ...chore,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            completed: false,
            completedAt: undefined,
            completedBy: undefined,
            dueDate: chore.nextDueDate,
            nextDueDate: calculateNextDueDate(chore.nextDueDate, chore.recurringType!, chore.recurringInterval!),
            createdAt: now.toISOString(),
          }
          newChores.push(newChore)
        }
      }
    })

    if (newChores.length > 0) {
      const updatedData = {
        ...currentData,
        chores: [...currentData.chores, ...newChores],
      }
      saveData(updatedData)
    }
  }

  const calculateNextDueDate = (currentDueDate: string, recurringType: string, interval: number): string => {
    const current = new Date(currentDueDate)

    switch (recurringType) {
      case "daily":
        return addDays(current, interval).toISOString()
      case "weekly":
        return addWeeks(current, interval).toISOString()
      case "monthly":
        return addMonths(current, interval).toISOString()
      case "custom":
        return addDays(current, interval).toISOString()
      default:
        return addWeeks(current, 1).toISOString()
    }
  }

  const saveData = (newData: ChoreboardData) => {
    if (!user) return
    const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
    localStorage.setItem(userDataKey, JSON.stringify(newData))
    localStorage.setItem("choreboardData", JSON.stringify(newData))
    setData(newData)
  }

  const handleAddChore = () => {
    if (!newChore.title || !newChore.assignedTo) {
      toast.error("Please fill in all required fields")
      return
    }

    const nextDueDate = newChore.isRecurring
      ? calculateNextDueDate(newChore.dueDate.toISOString(), newChore.recurringType, newChore.recurringInterval)
      : undefined

    const chore: Chore = {
      id: Date.now().toString(),
      title: newChore.title,
      description: newChore.description,
      assignedTo: newChore.assignedTo,
      dueDate: newChore.dueDate.toISOString(),
      completed: false,
      priority: newChore.priority,
      category: newChore.category,
      createdAt: new Date().toISOString(),
      isRecurring: newChore.isRecurring,
      recurringType: newChore.isRecurring ? newChore.recurringType : undefined,
      recurringInterval: newChore.isRecurring ? newChore.recurringInterval : undefined,
      nextDueDate,
    }

    const newData = {
      ...data,
      chores: [...data.chores, chore],
    }

    saveData(newData)
    setNewChore({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: new Date(),
      priority: "medium",
      category: "general",
      isRecurring: false,
      recurringType: "weekly",
      recurringInterval: 1,
    })
    setIsDialogOpen(false)
    toast.success("Chore added successfully!")
  }

  const handleEditChore = () => {
    if (!editingChore || !editingChore.title || !editingChore.assignedTo) {
      toast.error("Please fill in all required fields")
      return
    }

    const newData = {
      ...data,
      chores: data.chores.map((chore) => (chore.id === editingChore.id ? editingChore : chore)),
    }

    saveData(newData)
    setEditingChore(null)
    toast.success("Chore updated successfully!")
  }

  const canMarkComplete = (chore: Chore) => {
    // Admin can mark any chore complete, or the assigned user can mark their own chore complete
    return user?.isAdmin || chore.assignedTo === user?.id
  }

  const handleCompleteChore = (choreId: string) => {
    const chore = data.chores.find((c) => c.id === choreId)
    if (!chore) return

    if (!canMarkComplete(chore)) {
      toast.error("You can only mark your own assigned chores as complete")
      return
    }

    const wasCompleted = chore.completed
    const updatedChore = {
      ...chore,
      completed: !chore.completed,
      completedAt: !chore.completed ? new Date().toISOString() : undefined,
      completedBy: !chore.completed ? user?.id : undefined,
    }

    // If marking as complete and it's recurring, set up next due date
    if (!wasCompleted && chore.isRecurring) {
      updatedChore.nextDueDate = calculateNextDueDate(chore.dueDate, chore.recurringType!, chore.recurringInterval!)
    }

    const newData = {
      ...data,
      chores: data.chores.map((c) => (c.id === choreId ? updatedChore : c)),
    }

    // If chore is being marked as complete, remove it from missed tasks
    if (!wasCompleted) {
      newData.missedTasks = data.missedTasks?.filter((missed) => missed.choreId !== choreId) || []
    }

    saveData(newData)

    if (!wasCompleted && chore.isRecurring) {
      toast.success(`Chore completed! Next due: ${format(new Date(updatedChore.nextDueDate!), "PPP")}`)
    } else {
      toast.success(wasCompleted ? "Chore marked as incomplete" : "Chore completed! Great job!")
    }
  }

  const handleDeleteChore = (choreId: string) => {
    const newData = {
      ...data,
      chores: data.chores.filter((chore) => chore.id !== choreId),
      // Also remove from missed tasks
      missedTasks: data.missedTasks?.filter((missed) => missed.choreId !== choreId) || [],
    }

    saveData(newData)
    toast.success("Chore deleted successfully!")
  }

  const filteredChores = data.chores.filter((chore) => {
    const matchesSearch =
      chore.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chore.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && chore.completed) ||
      (filterStatus === "pending" && !chore.completed)
    const matchesPriority = filterPriority === "all" || chore.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getUserName = (userId: string) => {
    const user = data.users.find((u: any) => u.id === userId)
    return user ? user.name : "Unknown User"
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
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
                <h2 className="text-3xl font-bold text-foreground">Household Chores</h2>
                <p className="text-muted-foreground">Manage and track your household tasks</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chore
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Chore</DialogTitle>
                    <DialogDescription>Create a new household task and assign it to a member.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter chore title"
                        value={newChore.title}
                        onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter chore description"
                        value={newChore.description}
                        onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assign To *</Label>
                        <Select
                          value={newChore.assignedTo}
                          onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })}
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
                        <Label>Priority</Label>
                        <Select
                          value={newChore.priority}
                          onValueChange={(value: "low" | "medium" | "high") =>
                            setNewChore({ ...newChore, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newChore.dueDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newChore.dueDate ? format(newChore.dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newChore.dueDate}
                              onSelect={(date) => date && setNewChore({ ...newChore, dueDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newChore.category}
                          onValueChange={(value) => setNewChore({ ...newChore, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="bathroom">Bathroom</SelectItem>
                            <SelectItem value="living-room">Living Room</SelectItem>
                            <SelectItem value="bedroom">Bedroom</SelectItem>
                            <SelectItem value="outdoor">Outdoor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Recurring Options */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            <Repeat className="w-4 h-4" />
                            Recurring Chore
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically recreate this chore when completed
                          </p>
                        </div>
                        <Switch
                          checked={newChore.isRecurring}
                          onCheckedChange={(checked) => setNewChore({ ...newChore, isRecurring: checked })}
                        />
                      </div>

                      {newChore.isRecurring && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Repeat Every</Label>
                            <Select
                              value={newChore.recurringType}
                              onValueChange={(value: "daily" | "weekly" | "monthly" | "custom") =>
                                setNewChore({ ...newChore, recurringType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="custom">Custom Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Interval</Label>
                            <Input
                              type="number"
                              min="1"
                              value={newChore.recurringInterval}
                              onChange={(e) =>
                                setNewChore({ ...newChore, recurringInterval: Number.parseInt(e.target.value) || 1 })
                              }
                              placeholder="1"
                            />
                            <p className="text-xs text-muted-foreground">
                              {newChore.recurringType === "daily" && `Every ${newChore.recurringInterval} day(s)`}
                              {newChore.recurringType === "weekly" && `Every ${newChore.recurringInterval} week(s)`}
                              {newChore.recurringType === "monthly" && `Every ${newChore.recurringInterval} month(s)`}
                              {newChore.recurringType === "custom" && `Every ${newChore.recurringInterval} day(s)`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddChore} className="flex-1">
                        Add Chore
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search chores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chores List */}
            <div className="space-y-4">
              {filteredChores.length > 0 ? (
                filteredChores.map((chore, index) => (
                  <Card
                    key={chore.id}
                    className={cn(
                      "transition-all duration-300 hover:shadow-lg animate-bounce-in",
                      chore.completed && "opacity-75",
                      !chore.completed &&
                        isOverdue(chore.dueDate) &&
                        "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
                    )}
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Completion Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteChore(chore.id)}
                            className={cn(
                              "mt-1 p-1 h-8 w-8 rounded-full transition-all duration-200",
                              chore.completed
                                ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-400"
                                : "hover:bg-muted border-2 border-dashed border-gray-300 hover:border-green-400",
                              !canMarkComplete(chore) && "opacity-50 cursor-not-allowed",
                            )}
                            disabled={!canMarkComplete(chore)}
                            title={
                              canMarkComplete(chore)
                                ? chore.completed
                                  ? "Mark as incomplete"
                                  : "Mark as complete"
                                : "Only assigned user or admin can mark complete"
                            }
                          >
                            <CheckCircle className={cn("w-4 h-4", chore.completed && "fill-current")} />
                          </Button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className={cn(
                                  "text-lg font-semibold",
                                  chore.completed && "line-through text-muted-foreground",
                                )}
                              >
                                {chore.title}
                              </h3>
                              <Badge
                                variant={
                                  chore.priority === "high"
                                    ? "destructive"
                                    : chore.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {chore.priority}
                              </Badge>
                              <Badge variant="outline">{chore.category}</Badge>
                              {chore.isRecurring && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  <Repeat className="w-3 h-3 mr-1" />
                                  Recurring
                                </Badge>
                              )}
                              {chore.completed && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ✅ Completed
                                </Badge>
                              )}
                              {!chore.completed && isOverdue(chore.dueDate) && (
                                <Badge variant="destructive" className="animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>

                            {chore.description && <p className="text-muted-foreground mb-3">{chore.description}</p>}

                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>Assigned to: {getUserName(chore.assignedTo)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span
                                    className={cn(
                                      !chore.completed &&
                                        isOverdue(chore.dueDate) &&
                                        "text-red-600 dark:text-red-400 font-medium",
                                    )}
                                  >
                                    Due: {new Date(chore.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {chore.completed && chore.completedAt && (
                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Completed: {new Date(chore.completedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {/* Recurring Info */}
                              {chore.isRecurring && (
                                <div className="flex items-center gap-4 text-sm text-purple-600 dark:text-purple-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      Repeats: {chore.recurringType}
                                      {chore.recurringInterval &&
                                        chore.recurringInterval > 1 &&
                                        ` (every ${chore.recurringInterval})`}
                                    </span>
                                  </div>
                                  {chore.nextDueDate && chore.completed && (
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      <span>Next: {new Date(chore.nextDueDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {!canMarkComplete(chore) && !chore.completed && (
                              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Only {getUserName(chore.assignedTo)} or an admin can mark this as complete
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(user.isAdmin || chore.assignedTo === user.id) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditingChore(chore)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Chore</DialogTitle>
                                  <DialogDescription>Update the chore details.</DialogDescription>
                                </DialogHeader>
                                {editingChore && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-title">Title *</Label>
                                      <Input
                                        id="edit-title"
                                        value={editingChore.title}
                                        onChange={(e) => setEditingChore({ ...editingChore, title: e.target.value })}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={editingChore.description}
                                        onChange={(e) =>
                                          setEditingChore({ ...editingChore, description: e.target.value })
                                        }
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Assign To *</Label>
                                        <Select
                                          value={editingChore.assignedTo}
                                          onValueChange={(value) =>
                                            setEditingChore({ ...editingChore, assignedTo: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
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
                                        <Label>Priority</Label>
                                        <Select
                                          value={editingChore.priority}
                                          onValueChange={(value: "low" | "medium" | "high") =>
                                            setEditingChore({ ...editingChore, priority: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Due Date</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !editingChore.dueDate && "text-muted-foreground",
                                              )}
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {editingChore.dueDate ? (
                                                format(new Date(editingChore.dueDate), "PPP")
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={new Date(editingChore.dueDate)}
                                              onSelect={(date) =>
                                                date &&
                                                setEditingChore({ ...editingChore, dueDate: date.toISOString() })
                                              }
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                          value={editingChore.category}
                                          onValueChange={(value) =>
                                            setEditingChore({ ...editingChore, category: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="kitchen">Kitchen</SelectItem>
                                            <SelectItem value="bathroom">Bathroom</SelectItem>
                                            <SelectItem value="living-room">Living Room</SelectItem>
                                            <SelectItem value="bedroom">Bedroom</SelectItem>
                                            <SelectItem value="outdoor">Outdoor</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button onClick={handleEditChore} className="flex-1">
                                        Update Chore
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditingChore(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}

                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteChore(chore.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="animate-slide-in">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No chores found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || filterStatus !== "all" || filterPriority !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Get started by adding your first household chore"}
                    </p>
                    {!searchTerm && filterStatus === "all" && filterPriority === "all" && (
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Chore
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          
            {/* MongoDB Tasks Section */}
            <section className="mt-10 border-t pt-8">
              <h3 className="text-xl font-bold mb-4">External MongoDB Tasks</h3>
              <form onSubmit={handleMongoSubmit} className="flex gap-2 mb-4">
                <input
                  name="taskTitle"
                  placeholder="Add external task..."
                  className="border rounded px-3 py-2 w-full"
                />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                  Add
                </button>
              </form>

              <ul className="space-y-2">
                {externalTasks.map((task, index) => (
                  <li key={index} className="bg-white dark:bg-gray-800 p-3 rounded shadow text-sm">
                    ✅ {task.title} — {task.completed ? "Done" : "Pending"}
                  </li>
                ))}
              </ul>
            </section>

</main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
