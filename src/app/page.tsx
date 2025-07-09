'use client';

import { useState, useEffect, useRef } from 'react';
import { TimeSelector } from '@/components/TimeSelector';
import { CircleTimer } from '@/components/CircleTimer';
import type { Task, TimerSet } from '@/types/task';
import { NotificationManager } from '@/components/NotificationManager';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { TimerButtons } from '@/components/TimerButtons';
import { TimerHeader } from '@/components/TimerHeader';
import { SavedSets } from '@/components/SavedSets';
import { SaveSetForm } from '@/components/SaveSetForm';
import { addHours } from 'date-fns';

// 더 다양한 고채도/명도/색상 팔레트
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD166', '#8338EC', '#FF9F1C', '#118AB2', '#06D6A0', '#EF476F', '#073B4C'];

export default function Home() {
  // 초기 시간 설정
  const [endTime, setEndTime] = useState<{ hours: number; minutes: number }>(() => {
    const defaultTime = addHours(new Date(), 1);
    return {
      hours: defaultTime.getHours(),
      minutes: defaultTime.getMinutes()
    };
  });
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [actualEndTime, setActualEndTime] = useState<Date | null>(null); // 실제 종료 시간 추가
  
  // 기본 작업 설정
  const [tasks, setTasks] = useState<Task[]>(() => [
    { name: '작업 1', percentage: 33.33, color: '#FF6B6B', id: '1', duration: 20 },
    { name: '작업 2', percentage: 33.33, color: '#4ECDC4', id: '2', duration: 20 },
    { name: '작업 3', percentage: 33.34, color: '#45B7D1', id: '3', duration: 20 }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isTimeSelectVisible, setIsTimeSelectVisible] = useState(false);
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);
  const [isSaveFormVisible, setIsSaveFormVisible] = useState(false);
  const [setsRefreshKey, setSetsRefreshKey] = useState(0);

  const timeSelectorRef = useRef<HTMLDivElement>(null);

  // 총 시간 계산 (분)
  const calculateTotalMinutes = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(endTime.hours);
    end.setMinutes(endTime.minutes);
    
    // 종료 시각이 현재보다 이전이면 다음 날로 설정
    if (end < now) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
  };

  // 설정 시점의 총량(분) - 대기 상태에서 고정
  const [initialTotalMinutes, setInitialTotalMinutes] = useState<number>(() => calculateTotalMinutes());
  // 종료시각 변경 시점에 고정값 갱신
  function calculateTotalMinutesFor(hours: number, minutes: number) {
    const now = new Date();
    const end = new Date();
    end.setHours(hours);
    end.setMinutes(minutes);
    if (end < now) end.setDate(end.getDate() + 1);
    return Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
  }

  const handleTimeClick = (e: React.MouseEvent) => {
    if (isRunning) return;
    e.stopPropagation(); // 이벤트 버블링 방지
    setIsTimeSelectVisible(true);
    setIsTaskFormVisible(false);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (
      isTimeSelectVisible &&
      timeSelectorRef.current &&
      timeSelectorRef.current.contains(e.target as Node)
    ) {
      // TimeSelector 내부 클릭이면 닫지 않음
      return;
    }
    setIsTimeSelectVisible(false);
  };

  const handleTaskClick = () => {
    if (isRunning) return;
    setIsTaskFormVisible(true);
    setIsTimeSelectVisible(false);
  };

  // 시간 기반 비율 계산 함수
  function calculatePercentagesFromMinutes(tasks: Task[], totalMinutes: number): Task[] {
    if (tasks.length === 0) return [];
    return tasks.map(task => ({
      ...task,
      percentage: Math.round((task.minutes ?? task.duration ?? 0) / totalMinutes * 1000) / 10
    }));
  }

  const handleTimeSelect = (hours: number, minutes: number) => {
    setEndTime({ hours, minutes });
    // 시간이 변경되면 설정 총량도 갱신
    const newTotal = calculateTotalMinutesFor(hours, minutes);
    setInitialTotalMinutes(newTotal);
    // 테스크가 있다면, 비율대로 minutes 재분배
    if (tasks.length > 0) {
      const even = Math.floor(newTotal / tasks.length);
      const updatedTasks = tasks.map((task, idx) => ({
        ...task,
        minutes: idx === tasks.length - 1 ? newTotal - even * (tasks.length - 1) : even,
        duration: idx === tasks.length - 1 ? newTotal - even * (tasks.length - 1) : even,
      }));
      setTasks(updatedTasks);
    } else {
      setTasks(calculatePercentagesFromMinutes(tasks, newTotal));
    }
  };

  const handleTaskAdd = (newTask: Omit<Task, 'id' | 'duration'>) => {
    const totalMinutes = calculateTotalMinutes();
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      isManual: false,
    };
    const nextTasks = [...tasks, task];

    setTasks(calculatePercentagesFromMinutes(nextTasks, totalMinutes));
  };

  const handleTaskDelete = (id: string) => {
    const filtered = tasks.filter(task => task.id !== id);
    const totalMinutes = calculateTotalMinutes();
    setTasks(calculatePercentagesFromMinutes(filtered, totalMinutes));
  };

  const handleTaskComplete = (taskId: string) => {
    if (typeof window !== "undefined" && hasNotificationPermission) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        new Notification('작업 전환', {
          body: `${task.name} 작업이 완료되었습니다.`,
        });
      }
    }

    const nextTaskIndex = tasks.findIndex(t => t.id === taskId) + 1;
    if (nextTaskIndex >= tasks.length) {
      // 타이머 완료 시 실제 종료 시간 기록
      setActualEndTime(new Date());
      setIsComplete(true);
      setIsRunning(false); // 타이머 중지
    } else {
      setCurrentTaskId(tasks[nextTaskIndex].id);
    }
  };

  const handleStart = () => {
    const totalMinutes = calculateTotalMinutes();
    setTasks(calculatePercentagesFromMinutes(tasks, totalMinutes));
    setIsRunning(true);
    setStartTime(new Date());
    setCurrentTaskId(tasks[0]?.id || null);
    setIsTimeSelectVisible(false);
    setIsTaskFormVisible(false);
  };

  const handleReset = () => {
    const defaultTime = addHours(new Date(), 1);
    setIsRunning(false);
    setIsComplete(false);
    setEndTime({
      hours: defaultTime.getHours(),
      minutes: defaultTime.getMinutes()
    });
    setStartTime(null);
    setActualEndTime(null); // 실제 종료 시간도 초기화
    setTasks([]);
    setCurrentTaskId(null);
    setIsTimeSelectVisible(false);
    setIsTaskFormVisible(false);
  };

  const canStart = Boolean(tasks.length > 0);
  const totalMinutes = calculateTotalMinutes();

  const handleTaskCountChange = (type: 'add' | 'remove') => {
    if (type === 'add') {
      const newTaskNumber = tasks.length + 1;
      const totalMinutes = calculateTotalMinutes();
      
      // 기존 작업들의 시간 조정
      const newTaskMinutes = Math.floor(totalMinutes / newTaskNumber);
      const updatedTasks = tasks.map(task => ({
        ...task,
        minutes: newTaskMinutes,
        duration: newTaskMinutes
      }));

      // 새 작업 추가
      const newTask = {
        name: `작업 ${newTaskNumber}`,
        minutes: newTaskMinutes,
        percentage: 0, // calculatePercentagesFromMinutes에서 계산됨
        color: getRandomColor(),
        id: Math.random().toString(36).substr(2, 9),
        duration: newTaskMinutes
      };

      setTasks(calculatePercentagesFromMinutes([...updatedTasks, newTask], totalMinutes));
    } else {
      if (tasks.length <= 1) return;

      const newTaskNumber = tasks.length - 1;
      const totalMinutes = calculateTotalMinutes();

      // 마지막 작업을 제외하고 나머지 작업들의 시간 조정
      const newTaskMinutes = Math.floor(totalMinutes / newTaskNumber);
      const updatedTasks = tasks.slice(0, -1).map(task => ({
        ...task,
        minutes: newTaskMinutes,
        duration: newTaskMinutes
      }));

      setTasks(calculatePercentagesFromMinutes(updatedTasks, totalMinutes));
    }
  };

  let colorIndex = 0;
  const getRandomColor = () => {
    // 순차적으로 색상 할당, 부족하면 랜덤
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    return color;
  };

  // TaskList에서 작업 이름/시간/색상 수정 시 호출
  const handleTaskUpdate = (id: string, updates: Partial<Pick<Task, 'name' | 'percentage' | 'minutes' | 'seconds' | 'duration' | 'color'>>) => {
    setTasks(prevTasks => {
      const totalMinutes = calculateTotalMinutes();
      const nextTasks = prevTasks.map(task => {
        if (task.id === id) {
          return {
            ...task,
            ...updates
          };
        }
        return task;
      });
      return calculatePercentagesFromMinutes(nextTasks, totalMinutes);
    });
  };

  const handleSaveSet = (timerSet: TimerSet) => {
    const saved = localStorage.getItem('timerSets');
    const savedSets = saved ? JSON.parse(saved) : [];
    savedSets.push(timerSet);
    localStorage.setItem('timerSets', JSON.stringify(savedSets));
    setIsSaveFormVisible(false);
    setSetsRefreshKey(prev => prev + 1);
  };

  const handleLoadSet = (timerSet: TimerSet) => {
    // 현재 시각 기준으로 종료시각 계산
    const now = new Date();
    const end = new Date(now.getTime() + timerSet.totalMinutes * 60 * 1000);
    setEndTime({
      hours: end.getHours(),
      minutes: end.getMinutes()
    });
    setInitialTotalMinutes(timerSet.totalMinutes);
    setTasks(calculatePercentagesFromMinutes(timerSet.tasks, timerSet.totalMinutes));
    setIsTimeSelectVisible(false);
    setIsTaskFormVisible(false);
  };

  const handleDeleteSet = (id: string) => {
    const saved = localStorage.getItem('timerSets');
    if (saved) {
      const savedSets = JSON.parse(saved);
      const updated = savedSets.filter((set: TimerSet) => set.id !== id);
      localStorage.setItem('timerSets', JSON.stringify(updated));
    }
  };

  // 작업 순서 변경 함수
  const handleTaskReorder = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    if (direction === 'up' && index > 0) {
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    } else if (direction === 'down' && index < newTasks.length - 1) {
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    }
    const totalMinutes = calculateTotalMinutes();
    setTasks(calculatePercentagesFromMinutes(newTasks, totalMinutes));
  };

  // 테스크 시간 총합 계산
  const taskTotalMinutes = tasks.reduce((sum, t) => (t.minutes ?? t.duration ?? 0) + sum, 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.dataset.isRunning = isRunning.toString();
      return () => {
        delete document.body.dataset.isRunning;
      };
    }
  }, [isRunning]);
  


  return (
    <main className="container mx-auto max-w-2xl p-4" onClick={handleOutsideClick}>
      <h1 className="text-3xl font-bold text-center mb-8">⏱️ 시간분배 타이머</h1>
      
      <div className="flex justify-center mb-8">
        <CircleTimer
          tasks={tasks}
          isRunning={isRunning}
          totalMinutes={taskTotalMinutes}
          onTaskComplete={handleTaskComplete}
          endTime={endTime}
          onTaskCountChange={handleTaskCountChange}
          onTimeClick={handleTimeClick}
          startTime={startTime}
          onReset={handleReset}
          actualElapsedMinutes={
            startTime && actualEndTime 
              ? Math.round((actualEndTime.getTime() - startTime.getTime()) / 60000)
              : undefined
          }
        />
      </div>

      <TimerHeader
        endTime={endTime}
        taskCount={tasks.length}
        isRunning={isRunning}
        isComplete={isComplete}
        totalMinutes={totalMinutes}
        onTaskClick={handleTaskClick}
        onReset={handleReset}
        onTaskCountChange={handleTaskCountChange}
        startTime={startTime}
        actualEndTime={actualEndTime}
      />

      {/* 저장/불러오기 버튼들 */}
      {!isRunning && !isComplete && (
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setIsSaveFormVisible(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            현재 설정 저장
          </button>
          <SavedSets onLoadSet={handleLoadSet} onDeleteSet={handleDeleteSet} refreshKey={setsRefreshKey} />
        </div>
      )}
      
      {isTimeSelectVisible && !isRunning && (
        <div
          ref={timeSelectorRef}
          className="mb-8 bg-white rounded-lg shadow-lg time-selector"
        >
          <TimeSelector 
            onTimeSelect={handleTimeSelect} 
            initialTime={endTime}
          />
        </div>
      )}
      
      {isTaskFormVisible && !isRunning && (
        <div className="mb-8 bg-white rounded-lg shadow-lg">
          <TaskForm onTaskAdd={handleTaskAdd} totalMinutes={initialTotalMinutes} taskCount={tasks.length} />
          <TaskList 
            tasks={calculatePercentagesFromMinutes(tasks, initialTotalMinutes)} 
            onTaskDelete={handleTaskDelete} 
            onTaskUpdate={handleTaskUpdate}
            totalMinutes={initialTotalMinutes}
            onTaskReorder={handleTaskReorder}
          />
        </div>
      )}

      {!isComplete && !isRunning && (
        <TimerButtons
          isRunning={isRunning}
          canStart={canStart}
          isComplete={isComplete}
          onStart={handleStart}
          onReset={handleReset}
        />
      )}

      {isSaveFormVisible && (
        <SaveSetForm
          endTime={endTime}
          tasks={tasks}
          totalMinutes={totalMinutes}
          onSave={handleSaveSet}
          onCancel={() => setIsSaveFormVisible(false)}
        />
      )}

      <NotificationManager
        onPermissionChange={setHasNotificationPermission}
      />
    </main>
  );
}
