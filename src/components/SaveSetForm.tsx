import { useState } from 'react';
import type { TimerSet, Task } from '../types/task';

interface SaveSetFormProps {
  endTime: { hours: number; minutes: number };
  tasks: Task[];
  totalMinutes: number;
  onSave: (timerSet: TimerSet) => void;
  onCancel: () => void;
}

export const SaveSetForm = ({ endTime, tasks, totalMinutes, onSave, onCancel }: SaveSetFormProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const timerSet: TimerSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      tasks: tasks,
      endTime: endTime,
      totalMinutes: totalMinutes,
      createdAt: new Date()
    };

    onSave(timerSet);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">타이머 세트 저장</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
              세트 이름
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 아침 공부 세트"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-black">저장할 설정</h3>
            <div className="text-sm text-black space-y-1">
              <div>총 시간: {formatDuration(tasks.reduce((sum, t) => (t.minutes ?? t.duration ?? 0) + sum, 0))}</div>
              <div>작업 수: {tasks.length}개</div>
              <div>저장일시: {new Date().toLocaleString()}</div>
            </div>
            
            <div className="mt-3">
              <h4 className="font-medium text-sm mb-2 text-black">작업 목록</h4>
              <div className="space-y-1">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm text-black">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-black">{task.name}</span>
                    <span className="text-black">({task.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 