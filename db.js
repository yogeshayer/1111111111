require('dotenv').config(); // Load .env variables
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function connectToDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db("choreboard"); // name of your database
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

module.exports = connectToDB;
