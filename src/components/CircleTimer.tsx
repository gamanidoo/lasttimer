import { useEffect, useState, useRef } from 'react';
import type { Task } from '../types/task';
import { formatDurationSimple, minutesToSeconds } from '../utils/timeUtils';

interface CircleTimerProps {
  tasks: Task[];
  isRunning: boolean;
  totalMinutes: number;
  onTaskComplete: (taskId: string) => void;
  onTimerComplete?: () => void; // 타이머 완료 콜백 추가
  endTime: { hours: number; minutes: number };
  onTaskCountChange: (type: 'add' | 'remove') => void;
  onTimeClick: (e: React.MouseEvent) => void;
  startTime: Date | null;
  onReset: () => void;
  actualElapsedMinutes?: number; // 실제 경과 시간 (분)
}

// 시간 기반 비율 계산 함수 (정확한 계산)
function getTaskPercentages(tasks: Task[], totalMinutes: number): number[] {
  if (tasks.length === 0) return [];
  return tasks.map((task) => {
    // 초 단위가 있으면 초 우선, 없으면 분 단위 사용
    const taskSeconds = task.seconds ?? minutesToSeconds(task.minutes ?? task.duration ?? 0);
    const totalSeconds = minutesToSeconds(totalMinutes);
    // 반올림하지 않고 정확한 비율 계산
    return (taskSeconds / totalSeconds) * 100;
  });
}

// getCurrentTaskIndex 함수 제거 - currentTaskIndexRef.current를 직접 사용

export const CircleTimer = ({
  tasks,
  isRunning,
  totalMinutes,
  onTaskComplete,
  onTimerComplete,
  endTime,
  onTaskCountChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTimeClick,
  startTime,
  onReset,
  actualElapsedMinutes // eslint-disable-line @typescript-eslint/no-unused-vars
}: CircleTimerProps) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isTaskListVisible, setIsTaskListVisible] = useState(false);
  const hasEndedRef = useRef(false);
  const currentTaskIndexRef = useRef<number>(0);
  const taskListRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(Date.now());
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
    if (!isRunning || !startTime) return;

    const calculateElapsedTime = () => {
      // 종료시각과 무관하게, 시작~현재 경과 시간만 계산
      const elapsedMs = new Date().getTime() - startTime.getTime();
      const elapsedMins = elapsedMs / (1000 * 60);
      // 경과 시간이 총 시간을 초과하지 않도록 제한
      return Math.min(elapsedMins, totalMinutes);
    };

    const updateTimer = () => {
      // 경과 시간 업데이트
      const elapsed = calculateElapsedTime();
      setElapsedMinutes(elapsed);
      
      // 작업 전환 체크
      if (!hasEndedRef.current && tasks.length > 0) {
        let accumulatedMinutes = 0;
        
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          const taskDuration = (task.percentage / 100) * totalMinutes;
          accumulatedMinutes += taskDuration;
          
          // 현재 작업이 완료되었고 아직 처리되지 않은 경우
          if (elapsed >= accumulatedMinutes && currentTaskIndexRef.current === i) {
            currentTaskIndexRef.current = i + 1;
            onTaskComplete(task.id);
            break;
          }
        }
        
                 // 전체 타이머 완료 체크
         if (elapsed >= totalMinutes) {
           hasEndedRef.current = true;
           // 타이머 완료 콜백 호출
           if (onTimerComplete) {
             onTimerComplete();
           }
         }
      }

      lastUpdateRef.current = Date.now();
    };

    // 초기 업데이트
    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    // Page Visibility API를 사용하여 백그라운드/포그라운드 전환 감지
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 포그라운드로 돌아왔을 때 즉시 시간 업데이트
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 포커스 이벤트 처리 추가
    const handleFocus = () => {
      updateTimer();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isRunning, startTime, endTime, tasks, totalMinutes, onTaskComplete]);

  // 타이머 시작 또는 초기화 시 hasEndedRef와 currentTaskIndexRef 리셋
  useEffect(() => {
    if (!isRunning) {
      hasEndedRef.current = false;
      currentTaskIndexRef.current = 0;
      setElapsedMinutes(0);
    }
  }, [isRunning]);

  // 작업 진행 상태 체크 및 작업 전환 로직 제거 (중복 제거)
  // useEffect(() => {
  //   if (!isRunning || tasks.length === 0 || !startTime) return;
  //   ...
  // }, [isRunning, tasks, totalMinutes, startTime, onTaskComplete]);

  // 미작동(대기) 상태에서도 1분마다 현재시간 업데이트
  useEffect(() => {
    if (isRunning) return;
    const updateNow = () => setElapsedMinutes(prev => Math.min(prev + 1, totalMinutes));
    updateNow();
    const interval = setInterval(updateNow, 60 * 1000);
    return () => clearInterval(interval);
  }, [isRunning, totalMinutes]);

  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    return parts.join(' ');
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

  const handleTaskNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTaskListVisible(!isTaskListVisible);
  };

  // duration(분) 기준 비율 계산 및 duration 계산을 통일
  const percentages = getTaskPercentages(tasks, totalMinutes);
  const displayTasks: Task[] = tasks.map((task, idx) => ({
    ...task,
    percentage: percentages[idx],
    // 정확한 분 단위 사용 (반올림하지 않음)
    duration: task.minutes ?? task.duration ?? (totalMinutes * percentages[idx] / 100)
  }));

  // 현재 작업 인덱스 (실제 작업 전환 상태와 동기화)
  const currentTaskIndex = isRunning ? currentTaskIndexRef.current : 0;

  // 중앙 텍스트(현재 작업/남은 시간)
  const currentTask = displayTasks[currentTaskIndex];
  let currentTaskRemaining = 0;
  if (currentTask && isRunning) {
    // 작업 전환 로직과 동일한 방식으로 계산 (percentage 기반)
    let accumulatedMinutes = 0;
    for (let i = 0; i < currentTaskIndex; i++) {
      const taskDuration = (displayTasks[i].percentage / 100) * totalMinutes;
      accumulatedMinutes += taskDuration;
    }
    const currentTaskDuration = (currentTask.percentage / 100) * totalMinutes;
    const currentTaskElapsed = elapsedMinutes - accumulatedMinutes;
    currentTaskRemaining = currentTaskDuration - currentTaskElapsed;
    if (currentTaskRemaining < 0) currentTaskRemaining = 0;
  }

  const progress = elapsedMinutes / totalMinutes;

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
        {isRunning && displayTasks.length > 0 && (() => {
          let acc = 0;
          return displayTasks.map((task) => {
            const taskDuration = task.duration ?? 0;
            const taskStart = acc;
           
            const taskElapsed = Math.max(0, Math.min(elapsedMinutes - taskStart, taskDuration));
            const fillPercent = taskDuration > 0 ? taskElapsed / taskDuration : 0;
            const start = taskStart / totalMinutes;
            const end = (taskStart + taskElapsed) / totalMinutes;
            acc += taskDuration;
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
        {(() => {
          let currentPercentage = 0;
          return displayTasks.map((task) => {
            const startPercentage = currentPercentage;
            const endPercentage = startPercentage + (task.percentage / 100);
            currentPercentage = endPercentage;
            const taskProgress = Math.min(
              Math.max((progress - startPercentage) / (task.percentage / 100), 0),
              1
            );
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
          });
        })()}
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {isRunning && currentTask ? (
            <div className="text-lg font-medium">
              <button
                onClick={handleTaskNameClick}
                className="hover:text-yellow-500 transition-colors"
              >
                [{currentTask.name}]
              </button>
              <div>{
                (() => {
                  const min = Math.floor(currentTaskRemaining);
                  const sec = Math.floor((currentTaskRemaining - min) * 60);
                  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
                })()
              }</div>
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
            </div>
          )}
        </div>
      </div>

      {/* 원형 그래프와 테스크리스트 사이에 총 집중시간/종료시각 표시 */}
      {isRunning && (
        <div className="w-full flex flex-col items-center justify-center mt-4 mb-2">
          <div className="text-base font-semibold text-black dark:text-white">
            {formatTotalTime(totalMinutes)} 집중
          </div>
          <div className="text-sm text-black dark:text-white mt-1">
            종료시각 {endTime.hours.toString().padStart(2, '0')}:{endTime.minutes.toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* 테스크 리스트 항상 노출 */}
      {isRunning && (
        <div className="absolute left-1/2 top-full mt-4 transform -translate-x-1/2 z-10 w-full max-w-xs mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 min-w-[280px]">
            <div className="text-left text-sm font-normal space-y-2">
              {displayTasks.map((task, index) => {
                const percent = isNaN(task.percentage) ? 0 : task.percentage;
                const percentText = percent.toFixed(1) + '%';
                
                // 초 단위가 있으면 초 우선 사용, 없으면 duration(분) 사용
                const taskSeconds = task.seconds ?? minutesToSeconds(task.duration ?? 0);
                const durationText = formatDurationSimple(taskSeconds);
                const isCurrent = index === currentTaskIndex;
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded ${isCurrent ? 'bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: task.color }} />
                      <span className="font-medium text-black">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-black">{durationText}</span>
                      <span className="text-black">({percentText})</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 리스트 하단에 초기화 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={onReset}
                className="w-full py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors text-center"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 