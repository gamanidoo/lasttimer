import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  onTaskDelete: (id: string) => void;
  onTaskUpdate: (id: string, updates: Partial<Pick<Task, 'name' | 'percentage'>>) => void;
}

export const TaskList = ({ tasks, onTaskDelete, onTaskUpdate }: TaskListProps) => {
  return (
    <div className="space-y-2 p-4">
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
            <input
              type="number"
              value={task.percentage}
              min={1}
              max={100}
              onChange={e => onTaskUpdate(task.id, { percentage: Number(e.target.value) })}
              className="w-16 text-sm text-gray-700 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-right"
            />
            <span className="text-sm text-gray-500">% ({task.duration}분)</span>
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