import axios from 'axios';
import { useEffect, useState } from 'react';
import TaskForm from './TaskForm';

function App() {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await axios.get('http://localhost:3000/tasks');
    setTasks(res.data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🧹 ChoreBoard Tasks</h1>
      <TaskForm onTaskAdded={fetchTasks} />
      <ul>
        {tasks.map(task => (
          <li key={task._id}>
            ✅ {task.title} — {task.completed ? "Done" : "Not yet"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
