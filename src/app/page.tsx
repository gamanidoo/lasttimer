'use client';

import { useState, useEffect } from 'react';
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

  const handleTimeClick = () => {
    if (isRunning) return;
    setIsTimeSelectVisible(true);
    setIsTaskFormVisible(false);
  };

  const handleTaskClick = () => {
    if (isRunning) return;
    setIsTaskFormVisible(true);
    setIsTimeSelectVisible(false);
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    setEndTime({ hours, minutes });
    setIsTimeSelectVisible(false);
    
    // 시간이 변경되면 작업 duration 업데이트
    const totalMinutes = calculateTotalMinutes();
    setTasks(tasks.map(task => ({
      ...task,
      duration: Math.floor((task.percentage / 100) * totalMinutes)
    })));
  };

  const handleTaskAdd = (newTask: Omit<Task, 'id' | 'duration'>) => {
    // 빈 작업이 전달되면 폼을 닫음 (저장 버튼 클릭 시)
    if (!newTask.name && newTask.percentage === 0) {
      setIsTaskFormVisible(false);
      return;
    }

    const totalMinutes = calculateTotalMinutes();
    const duration = Math.floor((newTask.percentage / 100) * totalMinutes);
    
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      duration,
    };
    setTasks([...tasks, task]);
  };

  const handleTaskDelete = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
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

  useEffect(() => {
    // isRunning 상태를 body의 dataset에 저장
    document.body.dataset.isRunning = isRunning.toString();
    return () => {
      delete document.body.dataset.isRunning;
    };
  }, [isRunning]);

  return (
    <main className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold text-center mb-8">⏱️ 시간분배 타이머</h1>
      
      <div className="flex justify-center mb-8">
        <CircleTimer
          tasks={tasks}
          isRunning={isRunning}
          totalMinutes={totalMinutes}
          onTaskComplete={handleTaskComplete}
          endTime={endTime}
          onTaskCountChange={handleTaskCountChange}
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
      />
      
      {isTimeSelectVisible && !isRunning && (
        <div className="mb-8 bg-white rounded-lg shadow-lg">
          <TimeSelector onTimeSelect={handleTimeSelect} />
        </div>
      )}
      
      {isTaskFormVisible && !isRunning && (
        <div className="mb-8 bg-white rounded-lg shadow-lg">
          <TaskForm onTaskAdd={handleTaskAdd} totalMinutes={totalMinutes} />
          <TaskList tasks={tasks} onTaskDelete={handleTaskDelete} />
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
