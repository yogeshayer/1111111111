import { MongoClient, type Db } from "mongodb"

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://sunilayer018:t2rPxxBklFTv9wsC@choreboard.jdwvnun.mongodb.net/?retryWrites=true&w=majority"

let client: MongoClient
let db: Db

export async function connectToDatabase() {
  if (db) {
    return { client, db }
  }

  try {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db("choreboard")
    console.log("✅ Connected to MongoDB!")
    return { client, db }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    throw error
  }
}

export { db }
