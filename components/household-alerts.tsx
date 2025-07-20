"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Plus, Wrench, Zap, Shield, AlertCircle, Clock, CheckCircle, X } from "lucide-react"
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

interface HouseholdAlert {
  id: string
  title: string
  description: string
  category: "maintenance" | "utilities" | "security" | "emergency" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "resolved"
  reportedBy: string
  reportedAt: string
  updatedAt?: string
  updatedBy?: string
  resolvedAt?: string
  resolvedBy?: string
}

interface ChoreboardData {
  chores: any[]
  expenses: any[]
  users: User[]
  invitationCode?: string
  pendingRequests?: any[]
  missedTasks?: any[]
  householdAlerts?: HouseholdAlert[]
}

interface HouseholdAlertsProps {
  user: User
  data: ChoreboardData
  onDataUpdate: (newData: ChoreboardData) => void
}

export function HouseholdAlerts({ user, data, onDataUpdate }: HouseholdAlertsProps) {
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [newAlert, setNewAlert] = useState({
    title: "",
    description: "",
    category: "maintenance" as const,
    priority: "medium" as const,
  })

  const alerts = data.householdAlerts || []

  const getUserName = (userId: string) => {
    const foundUser = data.users.find((u) => u.id === userId)
    return foundUser ? foundUser.name : "Unknown User"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return Wrench
      case "utilities":
        return Zap
      case "security":
        return Shield
      case "emergency":
        return AlertTriangle
      default:
        return AlertCircle
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-green-600"
      case "in-progress":
        return "text-yellow-600"
      case "open":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return CheckCircle
      case "in-progress":
        return Clock
      case "open":
        return AlertCircle
      default:
        return AlertCircle
    }
  }

  const handleAddAlert = () => {
    if (!newAlert.title.trim() || !newAlert.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    const alert: HouseholdAlert = {
      id: Date.now().toString(),
      title: newAlert.title,
      description: newAlert.description,
      category: newAlert.category,
      priority: newAlert.priority,
      status: "open",
      reportedBy: user.id,
      reportedAt: new Date().toISOString(),
    }

    const newData = {
      ...data,
      householdAlerts: [...alerts, alert],
    }

    onDataUpdate(newData)
    setShowAddAlert(false)
    setNewAlert({
      title: "",
      description: "",
      category: "maintenance",
      priority: "medium",
    })
    toast.success("Alert reported successfully")
  }

  const handleUpdateStatus = (alertId: string, newStatus: "open" | "in-progress" | "resolved") => {
    const updatedAlerts = alerts.map((alert) => {
      if (alert.id === alertId) {
        const updatedAlert = {
          ...alert,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
        }

        if (newStatus === "resolved") {
          updatedAlert.resolvedAt = new Date().toISOString()
          updatedAlert.resolvedBy = user.id
        }

        return updatedAlert
      }
      return alert
    })

    const newData = {
      ...data,
      householdAlerts: updatedAlerts,
    }

    onDataUpdate(newData)
    toast.success(`Alert status updated to ${newStatus}`)
  }

  const handleDeleteAlert = (alertId: string) => {
    if (!user.isAdmin) {
      toast.error("Only admins can delete alerts")
      return
    }

    const updatedAlerts = alerts.filter((alert) => alert.id !== alertId)
    const newData = {
      ...data,
      householdAlerts: updatedAlerts,
    }

    onDataUpdate(newData)
    toast.success("Alert deleted successfully")
  }

  const openAlerts = alerts.filter((alert) => alert.status === "open")
  const inProgressAlerts = alerts.filter((alert) => alert.status === "in-progress")
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved")

  return (
    <Card
      className="animate-slide-in transform hover:shadow-xl transition-all duration-300"
      style={{ animationDelay: "0.7s" }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Household Alerts
            </CardTitle>
            <CardDescription>Report and track household issues</CardDescription>
          </div>
          <Dialog open={showAddAlert} onOpenChange={setShowAddAlert}>
            <DialogTrigger asChild>
              <Button size="sm" className="transform hover:scale-105 transition-transform duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Household Issue</DialogTitle>
                <DialogDescription>Report a problem or issue that needs attention in your household</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="e.g., Kitchen faucet leaking"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newAlert.description}
                    onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                    placeholder="Provide details about the issue..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newAlert.category}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAlert.priority}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddAlert(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAlert}>Report Issue</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {/* Open Alerts */}
            {openAlerts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Open Issues ({openAlerts.length})
                </h4>
                <div className="space-y-2">
                  {openAlerts.slice(0, 3).map((alert) => {
                    const IconComponent = getCategoryIcon(alert.category)
                    const StatusIcon = getStatusIcon(alert.status)
                    return (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10 transform hover:scale-[1.02] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <IconComponent className="w-4 h-4 text-orange-600" />
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{alert.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                                {alert.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">by {getUserName(alert.reportedBy)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={alert.status}
                            onValueChange={(value: any) => handleUpdateStatus(alert.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {openAlerts.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      And {openAlerts.length - 3} more open issues...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* In Progress Alerts */}
            {inProgressAlerts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-yellow-600 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  In Progress ({inProgressAlerts.length})
                </h4>
                <div className="space-y-2">
                  {inProgressAlerts.slice(0, 2).map((alert) => {
                    const IconComponent = getCategoryIcon(alert.category)
                    return (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10 transform hover:scale-[1.02] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <IconComponent className="w-4 h-4 text-yellow-600" />
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{alert.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                                {alert.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">by {getUserName(alert.reportedBy)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={alert.status}
                            onValueChange={(value: any) => handleUpdateStatus(alert.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {inProgressAlerts.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      And {inProgressAlerts.length - 2} more in progress...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recently Resolved */}
            {resolvedAlerts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Recently Resolved ({resolvedAlerts.length})
                </h4>
                <div className="space-y-2">
                  {resolvedAlerts
                    .sort((a, b) => new Date(b.resolvedAt || "").getTime() - new Date(a.resolvedAt || "").getTime())
                    .slice(0, 2)
                    .map((alert) => {
                      const IconComponent = getCategoryIcon(alert.category)
                      return (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10 opacity-75 transform hover:scale-[1.02] transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <IconComponent className="w-4 h-4 text-green-600" />
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{alert.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Resolved
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  by {getUserName(alert.resolvedBy || alert.reportedBy)}
                                </span>
                                {alert.resolvedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    • {new Date(alert.resolvedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  {resolvedAlerts.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      And {resolvedAlerts.length - 2} more resolved issues...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-medium text-foreground mb-2">No alerts reported</h3>
            <p className="text-muted-foreground mb-4">Your household is running smoothly!</p>
            <Button
              onClick={() => setShowAddAlert(true)}
              className="transform hover:scale-105 transition-transform duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Report First Issue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
