import { useState } from 'react';
import type { Task } from '../types/task';
import { formatDurationSimple, minutesToSeconds } from '../utils/timeUtils';

interface TaskListProps {
  tasks: Task[];
  onTaskDelete: (id: string) => void;
  onTaskUpdate: (id: string, updates: Partial<Pick<Task, 'name' | 'percentage' | 'minutes' | 'seconds' | 'duration' | 'color'>>) => void;
  totalMinutes: number;
  onTaskReorder: (index: number, direction: 'up' | 'down') => void;
}

export const TaskList = ({ tasks, onTaskDelete, onTaskUpdate, totalMinutes, onTaskReorder }: TaskListProps) => {
  const [colorPopup, setColorPopup] = useState<{taskId: string, color: string} | null>(null);

  const handleMinutesChange = (task: Task, minutes: number) => {
    const percentage = Math.round((minutes / totalMinutes) * 1000) / 10;
    const duration = minutes;
    const seconds = minutesToSeconds(minutes); // 초 단위로도 저장
    onTaskUpdate(task.id, { minutes, seconds, percentage, duration });
  };

  const handleColorChange = (color: string) => {
    setColorPopup(popup => popup ? { ...popup, color } : null);
  };

  const handleColorSave = () => {
    if (colorPopup) {
      onTaskUpdate(colorPopup.taskId, { color: colorPopup.color });
      setColorPopup(null);
    }
  };

  const handleColorCancel = () => setColorPopup(null);

  const totalTaskMinutes = tasks.reduce((sum, t) => (t.minutes ?? t.duration ?? 0) + sum, 0);
  // const percentages = getTaskPercentages(tasks, totalMinutes); // 원형 그래프용, 목록에서는 사용하지 않음

  return (
    <div className="space-y-2 p-4">
      <div className="mb-2 text-right text-black font-semibold">
        총합: {formatDurationSimple(minutesToSeconds(totalTaskMinutes))}
      </div>
      {tasks.map((task, idx) => {
        const minutes = task.minutes ?? task.duration ?? 0;
        const percent = totalTaskMinutes > 0 ? (minutes / totalTaskMinutes) * 100 : 0;
        
        // 시간 표시: 초 단위가 있으면 초 우선 사용
        const taskSeconds = task.seconds ?? minutesToSeconds(minutes);
        const durationText = formatDurationSimple(taskSeconds);
        
        return (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow relative"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-300"
                style={{ backgroundColor: task.color }}
                onClick={() => setColorPopup({ taskId: task.id, color: task.color })}
                title="색상 변경"
              />
              {colorPopup && colorPopup.taskId === task.id && (
                <div className="absolute z-20 left-0 top-10 bg-white border rounded shadow-lg p-3 flex flex-col items-center" style={{ minWidth: 120 }}>
                  <input
                    type="color"
                    value={colorPopup.color}
                    onChange={e => handleColorChange(e.target.value)}
                    className="mb-2 w-8 h-8 border-none bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleColorSave}
                      className="px-3 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600"
                    >저장</button>
                    <button
                      onClick={handleColorCancel}
                      className="px-3 py-1 rounded bg-gray-300 text-black text-xs hover:bg-gray-400"
                    >취소</button>
                  </div>
                </div>
              )}
              <input
                type="text"
                value={task.name}
                onChange={e => onTaskUpdate(task.id, { name: e.target.value })}
                className="font-medium border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent w-24 text-black"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1" // 0.1분 단위 입력 허용
                  value={task.minutes ?? task.duration ?? 0}
                  min={0.1}
                  max={totalMinutes}
                  onChange={e => handleMinutesChange(task, Number(e.target.value))}
                  className="w-16 text-sm text-gray-700 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-right"
                />
                <span className="text-sm text-black">분 ({durationText}, {percent.toFixed(1)}%)</span>
              </div>
              <div className="flex flex-col ml-2">
                <button
                  type="button"
                  className={`text-gray-500 hover:text-black text-xs ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  onClick={() => idx > 0 && onTaskReorder(idx, 'up')}
                  disabled={idx === 0}
                  title="위로 이동"
                >▲</button>
                <button
                  type="button"
                  className={`text-gray-500 hover:text-black text-xs ${idx === tasks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  onClick={() => idx < tasks.length - 1 && onTaskReorder(idx, 'down')}
                  disabled={idx === tasks.length - 1}
                  title="아래로 이동"
                >▼</button>
              </div>
            </div>
            <button
              onClick={() => onTaskDelete(task.id)}
              className="text-red-500 hover:text-red-700"
            >
              삭제
            </button>
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          추가된 작업이 없습니다
        </div>
      )}
    </div>
  );
}; 