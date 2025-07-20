const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://sunilayer018:t2rPxxBklFTv9wsC@choreboard.jdwvnun.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    return client.db("choreboard"); // you can use your DB name
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

module.exports = connectDB;
