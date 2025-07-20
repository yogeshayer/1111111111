'use client';

import axios from 'axios';
import { useState } from 'react';

type Props = {
  onTaskAdded: () => void;
};

export default function TaskForm({ onTaskAdded }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('http://localhost:3000/add-task', {
      title,
      completed: false,
    });
    setTitle('');
    onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task..."
        required
        style={{ padding: '8px', marginRight: '8px' }}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}
