'use client';

import { useState, useEffect, useRef } from 'react';
import { TimeSelector } from '@/components/TimeSelector';
import { CircleTimer } from '@/components/CircleTimer';
import type { Task } from '@/types/task';
import { NotificationManager } from '@/components/NotificationManager';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { TimerButtons } from '@/components/TimerButtons';
import { TimerHeader } from '@/components/TimerHeader';
import { addHours } from 'date-fns';

export default function Home() {
  // 초기 시간 설정
  const [endTime, setEndTime] = useState<{ hours: number; minutes: number }>(() => {
    const defaultTime = addHours(new Date(), 1);
    return {
      hours: defaultTime.getHours(),
      minutes: defaultTime.getMinutes()
    };
  });
  
  // 기본 작업 설정
  const [tasks, setTasks] = useState<Task[]>(() => [
    { name: '작업 1', percentage: 33.33, color: '#FF6B6B', id: '1', duration: 20 },
    { name: '작업 2', percentage: 33.33, color: '#4ECDC4', id: '2', duration: 20 },
    { name: '작업 3', percentage: 33.34, color: '#45B7D1', id: '3', duration: 20 }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isTimeSelectVisible, setIsTimeSelectVisible] = useState(false);
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);

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

  const handleTimeSelect = (hours: number, minutes: number) => {
    setEndTime({ hours, minutes });
    // 시간이 변경되면 작업 duration 업데이트
    const totalMinutes = calculateTotalMinutes();
    setTasks(tasks.map(task => ({
      ...task,
      duration: Math.floor((task.percentage / 100) * totalMinutes)
    })));
  };

  const handleTaskAdd = (newTask: Omit<Task, 'id' | 'duration'>) => {
    const totalMinutes = calculateTotalMinutes();
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      isManual: false,
    };
    const nextTasks = [...tasks, task];

    // 1. 수동 비율 작업의 합
    const manualTotal = nextTasks.filter(t => t.isManual).reduce((sum, t) => sum + t.percentage, 0);
    // 2. 자동 분배 대상
    const autoTasks = nextTasks.filter(t => !t.isManual);
    const autoCount = autoTasks.length;
    const remain = 100 - manualTotal;
    const even = autoCount > 0 ? remain / autoCount : 0;

    setTasks(
      nextTasks.map(t => ({
        ...t,
        percentage: t.isManual ? t.percentage : even,
        duration: Math.floor(((t.isManual ? t.percentage : even) / 100) * totalMinutes),
      }))
    );
  };

  const handleTaskDelete = (id: string) => {
    // 삭제 후 남은 tasks의 isManual을 그대로 유지
    const filtered = tasks.filter(task => task.id !== id);
    const totalMinutes = calculateTotalMinutes();
    // 1. 수동 비율 작업의 합
    const manualTotal = filtered.filter(t => t.isManual).reduce((sum, t) => sum + t.percentage, 0);
    // 2. 자동 분배 대상
    const autoTasks = filtered.filter(t => !t.isManual);
    const autoCount = autoTasks.length;
    const remain = 100 - manualTotal;
    const even = autoCount > 0 ? remain / autoCount : 0;

    setTasks(
      filtered.map(t => ({
        ...t,
        percentage: t.isManual ? t.percentage : even,
        duration: Math.floor(((t.isManual ? t.percentage : even) / 100) * totalMinutes),
      }))
    );
  };

  const handleTaskComplete = (taskId: string) => {
    if (hasNotificationPermission) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        new Notification('작업 전환', {
          body: `${task.name} 작업이 완료되었습니다.`,
        });
      }
    }

    const nextTaskIndex = tasks.findIndex(t => t.id === taskId) + 1;
    if (nextTaskIndex >= tasks.length) {
      setIsComplete(true);
    } else {
      setCurrentTaskId(tasks[nextTaskIndex].id);
    }
  };

  const handleStart = () => {
    const totalMinutes = calculateTotalMinutes();
    setTasks(tasks.map(task => ({
      ...task,
      duration: Math.floor((task.percentage / 100) * totalMinutes),
    })));
    setIsRunning(true);
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
      const newPercentage = 100 / newTaskNumber;
      const totalMinutes = calculateTotalMinutes();
      
      // 기존 작업들의 비율 조정
      const updatedTasks = tasks.map(task => ({
        ...task,
        percentage: newPercentage,
        duration: Math.floor((newPercentage / 100) * totalMinutes)
      }));

      // 새 작업 추가
      const newTask = {
        name: `작업 ${newTaskNumber}`,
        percentage: newPercentage,
        color: getRandomColor(),
        id: Math.random().toString(36).substr(2, 9),
        duration: Math.floor((newPercentage / 100) * totalMinutes)
      };

      setTasks([...updatedTasks, newTask]);
    } else {
      if (tasks.length <= 1) return;

      const newTaskNumber = tasks.length - 1;
      const newPercentage = 100 / newTaskNumber;
      const totalMinutes = calculateTotalMinutes();

      // 마지막 작업을 제외하고 나머지 작업들의 비율 조정
      const updatedTasks = tasks.slice(0, -1).map(task => ({
        ...task,
        percentage: newPercentage,
        duration: Math.floor((newPercentage / 100) * totalMinutes)
      }));

      setTasks(updatedTasks);
    }
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // TaskList에서 작업 이름/비율 수정 시 호출
  const handleTaskUpdate = (id: string, updates: Partial<Pick<Task, 'name' | 'percentage'>>) => {
    setTasks(prevTasks => {
      const totalMinutes = calculateTotalMinutes();
      // 1. 비율을 직접 수정한 Task는 isManual true로 설정
      let nextTasks = prevTasks.map(task => {
        if (task.id === id && updates.percentage !== undefined) {
          return {
            ...task,
            ...updates,
            isManual: true // 수동조정 표시
          };
        } else if (task.id === id && updates.name !== undefined) {
          return {
            ...task,
            ...updates
          };
        }
        return task;
      });
      // 2. 수동조정된 Task의 비율 합
      const manualTotal = nextTasks.filter(t => t.isManual).reduce((sum, t) => sum + t.percentage, 0);
      // 3. 자동조정 대상 Task
      const autoTasks = nextTasks.filter(t => !t.isManual);
      const autoCount = autoTasks.length;
      const remain = 100 - manualTotal;
      // 4. 자동조정 Task에 남은 비율 균등 분배
      nextTasks = nextTasks.map(task => {
        if (!task.isManual) {
          const even = autoCount > 0 ? remain / autoCount : 0;
          return {
            ...task,
            percentage: even
          };
        }
        return task;
      });
      // 5. duration 재계산
      return nextTasks.map(task => ({
        ...task,
        duration: Math.floor((task.percentage / 100) * totalMinutes)
      }));
    });
  };

  useEffect(() => {
    // isRunning 상태를 body의 dataset에 저장
    document.body.dataset.isRunning = isRunning.toString();
    return () => {
      delete document.body.dataset.isRunning;
    };
  }, [isRunning]);

  return (
    <main className="container mx-auto max-w-2xl p-4" onClick={handleOutsideClick}>
      <h1 className="text-3xl font-bold text-center mb-8">⏱️ 시간분배 타이머</h1>
      
      <div className="flex justify-center mb-8">
        <CircleTimer
          tasks={tasks}
          isRunning={isRunning}
          totalMinutes={totalMinutes}
          onTaskComplete={handleTaskComplete}
          endTime={endTime}
          onTaskCountChange={handleTaskCountChange}
          onTimeClick={handleTimeClick}
        />
      </div>

      <TimerHeader
        endTime={endTime}
        taskCount={tasks.length}
        isRunning={isRunning}
        isComplete={isComplete}
        totalMinutes={totalMinutes}
        onTimeClick={handleTimeClick}
        onTaskClick={handleTaskClick}
        onReset={handleReset}
        onTaskCountChange={handleTaskCountChange}
      />
      
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
          <TaskForm onTaskAdd={handleTaskAdd} totalMinutes={totalMinutes} taskCount={tasks.length} />
          <TaskList tasks={tasks} onTaskDelete={handleTaskDelete} onTaskUpdate={handleTaskUpdate} />
        </div>
      )}

      {!isComplete && (
        <TimerButtons
          isRunning={isRunning}
          canStart={canStart}
          isComplete={isComplete}
          onStart={handleStart}
          onReset={handleReset}
        />
      )}

      <NotificationManager
        onPermissionChange={setHasNotificationPermission}
      />
    </main>
  );
}
