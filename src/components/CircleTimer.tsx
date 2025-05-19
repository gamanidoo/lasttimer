import { useEffect, useState } from 'react';
import { format } from 'date-fns'; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { Task } from '../types/task';

interface CircleTimerProps {
  tasks: Task[];
  isRunning: boolean;
  totalMinutes: number;
  onTaskComplete: (taskId: string) => void;
  endTime: { hours: number; minutes: number };
  onTaskCountChange: (type: 'add' | 'remove') => void;
  onTimeClick: (e: React.MouseEvent) => void;
}

export const CircleTimer = ({
  tasks,
  isRunning,
  totalMinutes,
  onTaskComplete, // eslint-disable-line @typescript-eslint/no-unused-vars
  endTime,
  onTaskCountChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTimeClick
}: CircleTimerProps) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [displayEndTime, setDisplayEndTime] = useState(endTime);
  const size = 300;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // eslint-disable-line @typescript-eslint/no-unused-vars

  // endTime prop이 변경될 때마다 displayEndTime 업데이트
  useEffect(() => {
    setDisplayEndTime(endTime);
  }, [endTime]);

  // 현재 시각 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 타이머 시작 시 시작 시각을 기록
  useEffect(() => {
    if (isRunning && !startTime) {
      setStartTime(new Date());
    }
    if (!isRunning) {
      setStartTime(null);
    }
  }, [isRunning]);

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

  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
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
    
    // 작업 간 간격을 위한 조정 (각 작업 사이에 1도 간격)
    const gap = 1; // 1도 간격
    const adjustedStartAngle = startAngle + gap;
    const adjustedEndAngle = endAngle - gap;
    
    const start = {
      x: center + radius * Math.cos((adjustedStartAngle * Math.PI) / 180),
      y: center + radius * Math.sin((adjustedStartAngle * Math.PI) / 180)
    };
    
    const end = {
      x: center + radius * Math.cos((adjustedEndAngle * Math.PI) / 180),
      y: center + radius * Math.sin((adjustedEndAngle * Math.PI) / 180)
    };
    
    const largeArcFlag = endPercentage - startPercentage > 0.5 ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getPiePath = (startPercent: number, endPercent: number) => {
    const r = radius - strokeWidth / 2;
    const startAngle = startPercent * 2 * Math.PI - Math.PI / 2;
    const endAngle = endPercent * 2 * Math.PI - Math.PI / 2;
    const x1 = center + r * Math.cos(startAngle);
    const y1 = center + r * Math.sin(startAngle);
    const x2 = center + r * Math.cos(endAngle);
    const y2 = center + r * Math.sin(endAngle);
    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
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

        {/* 진행률 파이차트 (작업별 색상) */}
        {isRunning && tasks.length > 0 && (() => {
          let acc = 0;
          let remain = progress;
          return tasks.map((task, idx) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            const taskPercent = task.percentage / 100;
            const fillPercent = Math.min(remain, taskPercent);
            const start = acc;
            const end = acc + fillPercent;
            acc += taskPercent;
            remain -= fillPercent;
            if (fillPercent <= 0) return null;
            return (
              <path
                key={task.id}
                d={getPiePath(start, end)}
                fill={task.color}
                fillOpacity={0.4}
                stroke="none"
              />
            );
          });
        })()}

        {/* 작업 구간 (테두리) */}
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
              <div className="mb-2">
                <button
                  onClick={onTimeClick}
                  className="text-2xl font-bold text-yellow-500 hover:text-yellow-600 border-b border-dashed border-yellow-400 hover:border-yellow-500 transition-colors"
                >
                  {formatTotalTime(totalMinutes)} 동안
                </button>
              </div>
              {isRunning && startTime ? (
                <div>시작시간: {formatTimeText(startTime.getHours(), startTime.getMinutes())}</div>
              ) : (
                <div>지금시간: {formatTimeText(currentTime.getHours(), currentTime.getMinutes())}</div>
              )}
              <div>종료시간: {formatTimeText(displayEndTime.hours, displayEndTime.minutes)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 