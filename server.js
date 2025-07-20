const express = require('express');
const cors = require('cors');
const connectToDB = require('./db');

const app = express(); // ✅ Define app BEFORE using it

app.use(cors()); // ✅ Now this works fine
app.use(express.json()); // parse JSON body

app.get('/', (req, res) => {
  res.send('Welcome to ChoreBoard API!');
});

app.get('/tasks', async (req, res) => {
  const db = await connectToDB();
  const tasks = await db.collection('tasks').find().toArray();
  res.json(tasks);
});

app.post('/add-task', async (req, res) => {
  const db = await connectToDB();
  const { title, completed } = req.body;
  const result = await db.collection('tasks').insertOne({ title, completed });
  res.json({ message: '✅ Task added!', taskId: result.insertedId });
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = 'your-mongo-uri-here';
const client = new MongoClient(uri);
const dbName = 'choreboard';

app.post('/api/tasks', async (req, res) => {
  try {
    const db = client.db(dbName);
    const result = await db.collection('tasks').insertOne(req.body);
    res.status(200).json({ message: '✅ Task saved to MongoDB!', id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '❌ Failed to save task' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
