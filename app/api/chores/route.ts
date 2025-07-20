import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const chores = await db.collection("chores").find({}).toArray()

    return NextResponse.json(chores)
  } catch (error) {
    console.error("Error fetching chores:", error)
    return NextResponse.json({ error: "Failed to fetch chores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const newChore = {
      title: body.title,
      description: body.description || "",
      assignedTo: body.assignedTo,
      dueDate: body.dueDate,
      completed: false,
      priority: body.priority || "medium",
      category: body.category || "general",
      createdAt: new Date(),
      isRecurring: body.isRecurring || false,
      recurringType: body.recurringType,
      recurringInterval: body.recurringInterval,
      nextDueDate: body.nextDueDate,
    }

    const result = await db.collection("chores").insertOne(newChore)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      chore: { ...newChore, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating chore:", error)
    return NextResponse.json({ error: "Failed to create chore" }, { status: 500 })
  }
}
