import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const tasks = await db.collection("tasks").find({}).toArray()

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const newTask = {
      title: body.title,
      completed: body.completed || false,
      createdAt: new Date(),
    }

    const result = await db.collection("tasks").insertOne(newTask)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      task: newTask,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
