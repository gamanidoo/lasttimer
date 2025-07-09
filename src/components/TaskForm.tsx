import { useState, useCallback } from 'react';
import type { Task } from '../types/task';
import { minutesToSeconds, formatDurationSimple } from '../utils/timeUtils';

interface TaskFormProps {
  onTaskAdd: (task: Omit<Task, 'id' | 'duration'>) => void;
  totalMinutes: number;
  taskCount?: number;
}

export const TaskForm = ({ onTaskAdd, totalMinutes, taskCount = 0 }: TaskFormProps) => {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const placeholderName = `작업 ${taskCount + 1}`;

  const getRandomColor = useCallback(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const calculatePercentage = useCallback((minutes: number) => {
    return Math.round((minutes / totalMinutes) * 1000) / 10;
  }, [totalMinutes]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const taskName = name.trim() === '' ? placeholderName : name;
    
    const taskMinutes = minutes === '' ? 0 : Number(minutes);
    if (taskMinutes <= 0 || taskMinutes > totalMinutes) {
      alert(`시간은 0.1~${totalMinutes} 사이의 값이어야 합니다.`);
      return;
    }
    
    // 초 단위로 저장
    const taskSeconds = minutesToSeconds(taskMinutes);
    
    onTaskAdd({
      name: taskName,
      minutes: taskMinutes,
      seconds: taskSeconds, // 초 단위 추가
      percentage: calculatePercentage(taskMinutes),
      color: getRandomColor()
    });

    setName('');
    setMinutes('');
  }, [name, minutes, onTaskAdd, getRandomColor, placeholderName, totalMinutes, calculatePercentage]);

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
            step="0.1" // 0.1분 단위 입력 허용
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="시간"
            min="0.1" // 최소 0.1분(6초)
            max={totalMinutes}
            className="w-24 p-2 rounded border border-gray-300 text-black"
          />
          <span className="absolute right-3 text-gray-500">분</span>
        </div>
      </div>
      {totalMinutes > 0 && minutes && (
        <div className="text-sm text-gray-500">
          ≈ {calculatePercentage(Number(minutes))}%
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