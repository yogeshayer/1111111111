import axios from 'axios';
import { useState } from 'react';

function TaskForm({ onTaskAdded }) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:3000/add-task', {
      title,
      completed: false
    });
    setTitle('');
    onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default TaskForm;
