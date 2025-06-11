import { useEffect, useState, useRef } from 'react';
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
  onTaskComplete,
  endTime,
  onTaskCountChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTimeClick
}: CircleTimerProps) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTaskListVisible, setIsTaskListVisible] = useState(false);
  const hasEndedRef = useRef(false);
  const currentTaskIndexRef = useRef<number>(0);
  const taskListRef = useRef<HTMLDivElement>(null);
  const size = 300;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // eslint-disable-line @typescript-eslint/no-unused-vars

  // 작업 목록 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskListRef.current && !taskListRef.current.contains(event.target as Node)) {
        setIsTaskListVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 현재 시각 업데이트 및 종료 시각 체크
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // 종료 시각 체크
      if (isRunning && !hasEndedRef.current) {
        const endTimeDate = new Date();
        endTimeDate.setHours(endTime.hours);
        endTimeDate.setMinutes(endTime.minutes);
        endTimeDate.setSeconds(0);
        
        if (now >= endTimeDate) {
          hasEndedRef.current = true;
          // 마지막 작업 완료 처리
          if (tasks.length > 0) {
            onTaskComplete(tasks[tasks.length - 1].id);
          }
        }
      }
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [isRunning, endTime, tasks, onTaskComplete]);

  // 타이머 시작 또는 초기화 시 hasEndedRef와 currentTaskIndexRef 리셋
  useEffect(() => {
    if (!isRunning) {
      hasEndedRef.current = false;
      currentTaskIndexRef.current = 0;
    }
  }, [isRunning]);

  // 타이머 시작 시 시작 시각을 기록
  useEffect(() => {
    if (isRunning && !startTime) {
      setStartTime(new Date());
    }
    if (!isRunning) {
      setStartTime(null);
    }
  }, [isRunning]);

  // 작업 진행 상태 체크 및 작업 전환
  useEffect(() => {
    if (!isRunning || tasks.length === 0 || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      let accumulatedMinutes = 0;
      
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskDuration = (task.percentage / 100) * totalMinutes;
        accumulatedMinutes += taskDuration;
        
        // 작업 완료 예정 시각 계산
        const taskEndTime = new Date(startTime.getTime() + accumulatedMinutes * 60 * 1000);
        
        // 현재 시각이 작업 완료 예정 시각을 지났고, 아직 완료 처리되지 않은 경우
        if (now >= taskEndTime && currentTaskIndexRef.current === i) {
          currentTaskIndexRef.current = i + 1;
          onTaskComplete(task.id);
          break;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, tasks, totalMinutes, startTime, onTaskComplete]);

  useEffect(() => {
    if (!isRunning) {
      setElapsedMinutes(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedMinutes((prev) => {
        const now = new Date();
        const endTimeDate = new Date();
        endTimeDate.setHours(endTime.hours);
        endTimeDate.setMinutes(endTime.minutes);
        endTimeDate.setSeconds(0);
        
        // 종료 시각에 도달했으면 더 이상 증가하지 않음
        if (now >= endTimeDate) {
          return totalMinutes;
        }
        
        const next = prev + 1/60; // 1초마다 1/60분씩 증가
        return Math.min(next, totalMinutes);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, endTime, totalMinutes]);

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

    // 종료 시각 체크
    const now = new Date();
    const endTimeDate = new Date();
    endTimeDate.setHours(endTime.hours);
    endTimeDate.setMinutes(endTime.minutes);
    endTimeDate.setSeconds(0);
    
    if (now >= endTimeDate) {
      return null;
    }

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

  const handleTaskNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTaskListVisible(!isTaskListVisible);
  };

  const calculateTaskProgress = (taskIndex: number) => {
    let accumulatedMinutes = 0;
    for (let i = 0; i < taskIndex; i++) {
      accumulatedMinutes += (tasks[i].percentage / 100) * totalMinutes;
    }
    
    const taskDuration = (tasks[taskIndex].percentage / 100) * totalMinutes;
    const taskElapsedMinutes = Math.max(0, Math.min(elapsedMinutes - accumulatedMinutes, taskDuration));
    return {
      progress: Math.round((taskElapsedMinutes / taskDuration) * 100),
      elapsed: Math.round(taskElapsedMinutes),
      total: Math.round(taskDuration)
    };
  };

  const formatTaskDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
    }
    return `${mins}분`;
  };

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
              <button
                onClick={handleTaskNameClick}
                className="hover:text-yellow-500 transition-colors"
              >
                [{currentTaskInfo.name}]
              </button>
              <div>{currentTaskInfo.remainingTime}</div>
              
              {/* 작업 목록 팝업 */}
              {isTaskListVisible && (
                <div 
                  ref={taskListRef}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[280px] z-10"
                >
                  <div className="text-left text-sm font-normal space-y-2">
                    {tasks.map((task, index) => {
                      const { progress, elapsed, total } = calculateTaskProgress(index);
                      const isCurrent = index === currentTaskIndexRef.current;
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded ${
                            isCurrent ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: task.color }}
                              />
                              <span className="font-medium text-black">{task.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {progress}%
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 pl-5">
                            {isCurrent ? (
                              <>
                                {formatTaskDuration(elapsed)} / {formatTaskDuration(total)}
                              </>
                            ) : index < currentTaskIndexRef.current ? (
                              <span className="text-green-600">완료</span>
                            ) : (
                              <span>{formatTaskDuration(total)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <div className="mb-2">
                {hasEndedRef.current ? (
                  <div className="text-2xl font-bold text-yellow-500">
                    {formatTotalTime(totalMinutes)} 집중 완료!
                  </div>
                ) : (
                  <button
                    onClick={onTimeClick}
                    className="text-2xl font-bold text-yellow-500 hover:text-yellow-600 border-b border-dashed border-yellow-400 hover:border-yellow-500 transition-colors"
                  >
                    {formatTotalTime(totalMinutes)} 동안
                  </button>
                )}
              </div>
              {isRunning && startTime ? (
                <div>시작시간: {formatTimeText(startTime.getHours(), startTime.getMinutes())}</div>
              ) : (
                <div>지금시간: {formatTimeText(currentTime.getHours(), currentTime.getMinutes())}</div>
              )}
              <div>종료시간: {formatTimeText(endTime.hours, endTime.minutes)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 