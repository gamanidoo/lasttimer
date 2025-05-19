import { useState, useCallback } from 'react';
import type { Task } from '../types/task';

interface TaskFormProps {
  onTaskAdd: (task: Omit<Task, 'id' | 'duration'>) => void;
  totalMinutes: number;
  taskCount?: number;
}

export const TaskForm = ({ onTaskAdd, totalMinutes, taskCount = 0 }: TaskFormProps) => {
  const defaultPercentage = taskCount > 0 ? Math.floor(100 / (taskCount + 1)) : 100;
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState(String(defaultPercentage));
  const placeholderName = `작업 ${taskCount + 1}`;

  const getRandomColor = useCallback(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const calculateDuration = useCallback((percentage: number) => {
    return Math.floor((percentage / 100) * totalMinutes);
  }, [totalMinutes]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const taskName = name.trim() === '' ? placeholderName : name;
    const taskPercentage = percentage === '' ? defaultPercentage : Number(percentage);

    if (taskPercentage <= 0 || taskPercentage > 100) {
      alert('비율은 1~100 사이의 값이어야 합니다.');
      return;
    }

    onTaskAdd({
      name: taskName,
      percentage: taskPercentage,
      color: getRandomColor()
    });

    setName('');
    setPercentage(String(defaultPercentage));
  }, [name, percentage, onTaskAdd, getRandomColor, defaultPercentage, placeholderName]);

  const handleSave = useCallback(() => { // eslint-disable-line @typescript-eslint/no-unused-vars
    onTaskAdd({ name: '', percentage: 0, color: '' });
  }, [onTaskAdd]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholderName}
          className="flex-1 p-2 rounded border border-gray-300 text-black"
        />
        <div className="relative flex items-center">
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="비율"
            min="1"
            max="100"
            className="w-24 p-2 rounded border border-gray-300 text-black"
          />
          <span className="absolute right-3 text-gray-500">%</span>
        </div>
      </div>
      {totalMinutes > 0 && percentage && (
        <div className="text-sm text-gray-500">
          ≈ {calculateDuration(Number(percentage))}분
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          disabled={false}
        >
          작업 추가
        </button>
      </div>
    </form>
  );
}; 