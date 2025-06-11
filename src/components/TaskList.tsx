import { useState } from 'react';
import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  onTaskDelete: (id: string) => void;
  onTaskUpdate: (id: string, updates: Partial<Pick<Task, 'name' | 'percentage' | 'minutes'>>) => void;
  totalMinutes: number;
}

export const TaskList = ({ tasks, onTaskDelete, onTaskUpdate, totalMinutes }: TaskListProps) => {
  const [inputMode, setInputMode] = useState<'percentage' | 'minutes'>('percentage');

  const handleMinutesChange = (task: Task, minutes: number) => {
    const percentage = Math.floor((minutes / totalMinutes) * 100);
    onTaskUpdate(task.id, { minutes, percentage });
  };

  const handlePercentageChange = (task: Task, percentage: number) => {
    const minutes = Math.floor((percentage / 100) * totalMinutes);
    onTaskUpdate(task.id, { percentage, minutes });
  };

  return (
    <div className="space-y-2 p-4">
      <div className="flex justify-end mb-4">
        <select
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value as 'percentage' | 'minutes')}
          className="p-2 rounded border border-gray-300 text-black text-sm"
        >
          <option value="percentage">비율로 보기</option>
          <option value="minutes">시간으로 보기</option>
        </select>
      </div>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: task.color }}
            />
            <input
              type="text"
              value={task.name}
              onChange={e => onTaskUpdate(task.id, { name: e.target.value })}
              className="font-medium border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent w-24"
            />
            {inputMode === 'percentage' ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={task.percentage}
                  min={1}
                  max={100}
                  onChange={e => handlePercentageChange(task, Number(e.target.value))}
                  className="w-16 text-sm text-gray-700 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-right"
                />
                <span className="text-sm text-gray-500">% ({task.duration}분)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={task.minutes || task.duration}
                  min={1}
                  max={totalMinutes}
                  onChange={e => handleMinutesChange(task, Number(e.target.value))}
                  className="w-16 text-sm text-gray-700 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-right"
                />
                <span className="text-sm text-gray-500">분 ({task.percentage}%)</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onTaskDelete(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            삭제
          </button>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          추가된 작업이 없습니다
        </div>
      )}
    </div>
  );
}; 