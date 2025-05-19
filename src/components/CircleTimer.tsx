import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Task } from '../types/task';

interface CircleTimerProps {
  tasks: Task[];
  isRunning: boolean;
  totalMinutes: number;
  onTaskComplete: (taskId: string) => void;
  endTime: { hours: number; minutes: number };
  onTaskCountChange: (type: 'add' | 'remove') => void;
}

export const CircleTimer = ({
  tasks,
  isRunning,
  totalMinutes,
  onTaskComplete,
  endTime,
  onTaskCountChange
}: CircleTimerProps) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const size = 300;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // 현재 시각 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setElapsedMinutes(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedMinutes((prev) => {
        const next = prev + 1/60; // 1초마다 1/60분씩 증가
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimeText = (hours: number, minutes: number) => {
    const parts = [];
    if (hours > 0) parts.push(`${hours}시`);
    if (minutes > 0) parts.push(`${minutes}분`);
    return parts.join(' ');
  };

  const getCurrentTaskInfo = () => {
    if (!isRunning || tasks.length === 0) return null;

    let accumulatedMinutes = 0;
    for (const task of tasks) {
      const taskDuration = (task.percentage / 100) * totalMinutes;
      if (accumulatedMinutes + taskDuration > elapsedMinutes) {
        const remainingMinutes = taskDuration - (elapsedMinutes - accumulatedMinutes);
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = Math.floor(remainingMinutes % 60);
        const seconds = Math.floor((remainingMinutes % 1) * 60);
        
        return {
          name: task.name,
          remainingTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        };
      }
      accumulatedMinutes += taskDuration;
    }
    return null;
  };

  const getTaskArc = (startPercentage: number, endPercentage: number) => {
    // 12시 방향(-90도)에서 시작
    const startAngle = (startPercentage * 360) - 90;
    const endAngle = (endPercentage * 360) - 90;
    
    const start = {
      x: center + radius * Math.cos((startAngle * Math.PI) / 180),
      y: center + radius * Math.sin((startAngle * Math.PI) / 180)
    };
    
    const end = {
      x: center + radius * Math.cos((endAngle * Math.PI) / 180),
      y: center + radius * Math.sin((endAngle * Math.PI) / 180)
    };
    
    const largeArcFlag = endPercentage - startPercentage > 0.5 ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getProgressArc = (progress: number) => {
    // 12시 방향(-90도)에서 시작
    const startAngle = -90;
    const endAngle = (progress * 360) - 90;
    
    const start = {
      x: center + radius * Math.cos((startAngle * Math.PI) / 180),
      y: center + radius * Math.sin((startAngle * Math.PI) / 180)
    };
    
    const end = {
      x: center + radius * Math.cos((endAngle * Math.PI) / 180),
      y: center + radius * Math.sin((endAngle * Math.PI) / 180)
    };
    
    const largeArcFlag = progress > 0.5 ? 1 : 0;
    
    return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  let currentPercentage = 0;
  const progress = elapsedMinutes / totalMinutes;
  const currentTaskInfo = getCurrentTaskInfo();

  return (
    <div className="relative">
      <svg width={size} height={size}>
        {/* 배경 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />

        {/* 작업 구간 */}
        {tasks.map((task) => {
          const startPercentage = currentPercentage;
          const endPercentage = startPercentage + (task.percentage / 100);
          const taskProgress = Math.min(
            Math.max((progress - startPercentage) / (task.percentage / 100), 0),
            1
          );
          
          currentPercentage = endPercentage;

          return (
            <path
              key={task.id}
              d={getTaskArc(startPercentage, endPercentage)}
              fill="none"
              stroke={task.color}
              strokeWidth={strokeWidth}
              strokeOpacity={isRunning ? (taskProgress > 0 ? 1 : 0.3) : 0.3}
            />
          );
        })}

        {/* 진행률 표시 (파이 차트) */}
        {isRunning && (
          <path
            d={getProgressArc(progress)}
            fill="rgba(0, 0, 0, 0.2)"
            stroke="none"
          />
        )}
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {isRunning && currentTaskInfo ? (
            <div className="text-lg font-medium">
              <div>[{currentTaskInfo.name}]</div>
              <div>{currentTaskInfo.remainingTime}</div>
            </div>
          ) : (
            <div className="text-sm">
              <div>시작시간: {formatTimeText(currentTime.getHours(), currentTime.getMinutes())}</div>
              <div>종료시간: {formatTimeText(endTime.hours, endTime.minutes)}</div>
            </div>
          )}
        </div>
      </div>

      {/* 작업 개수 조절 버튼 */}
      {!isRunning && (
        <>
          {/* 작업 제거 버튼 */}
          <button
            onClick={() => onTaskCountChange('remove')}
            disabled={tasks.length <= 1}
            className={`absolute left-4 -bottom-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors ${
              tasks.length <= 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            title="작업 제거"
          >
            -
          </button>

          {/* 작업 추가 버튼 */}
          <button
            onClick={() => onTaskCountChange('add')}
            className="absolute right-4 -bottom-4 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white text-lg font-bold transition-colors"
            title="작업 추가"
          >
            +
          </button>
        </>
      )}
    </div>
  );
}; 