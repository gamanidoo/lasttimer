import { useState, useCallback } from 'react';
import type { Task } from '../types/task';

interface TaskFormProps {
  onTaskAdd: (task: Omit<Task, 'id' | 'duration'>) => void;
  totalMinutes: number;
}

export const TaskForm = ({ onTaskAdd, totalMinutes }: TaskFormProps) => {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');

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
    if (!name || !percentage) return;

    const newPercentage = Number(percentage);
    if (newPercentage <= 0 || newPercentage > 100) {
      alert('비율은 1~100 사이의 값이어야 합니다.');
      return;
    }

    onTaskAdd({
      name,
      percentage: newPercentage,
      color: getRandomColor()
    });

    setName('');
    setPercentage('');
  }, [name, percentage, onTaskAdd, getRandomColor]);

  const handleSave = useCallback(() => {
    onTaskAdd({ name: '', percentage: 0, color: '' });
  }, [onTaskAdd]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="작업 이름"
          className="flex-1 p-2 rounded border border-gray-300"
        />
        <div className="relative flex items-center">
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="비율"
            min="1"
            max="100"
            className="w-24 p-2 rounded border border-gray-300"
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
          disabled={!name || !percentage}
        >
          작업 추가
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          저장
        </button>
      </div>
    </form>
  );
}; 