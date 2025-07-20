import { connectToDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

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

    const chore = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("chores").insertOne(chore)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error creating chore:", error)
    return NextResponse.json({ error: "Failed to create chore" }, { status: 500 })
  }
}
