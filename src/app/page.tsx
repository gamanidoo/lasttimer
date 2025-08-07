'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeSelector } from '@/components/TimeSelector';
import { CircleTimer } from '@/components/CircleTimer';
import { StatisticsView } from '@/components/StatisticsView';
import type { Task, TimerSet } from '@/types/task';
import { NotificationManager } from '@/components/NotificationManager';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { TimerButtons } from '@/components/TimerButtons';
import { TimerHeader } from '@/components/TimerHeader';
import { SavedSets } from '@/components/SavedSets';
import { SaveSetForm } from '@/components/SaveSetForm';
import { addHours } from 'date-fns';
import { 
  logTimerStart, 
  logTimerComplete, 
  logTimerReset, 
  logSetSave, 
  logSetLoad, 
  logSetDelete,
  logTaskAdd,
  logTaskDelete,
  logTaskUpdate
} from '@/utils/logService';
import { event as gtag_event } from '@/utils/gtag';

// 더 다양한 고채도/명도/색상 팔레트
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD166', '#8338EC', '#FF9F1C', '#118AB2', '#06D6A0', '#EF476F', '#073B4C'];

export default function Home() {
  // 관리자 모드 상태
  const [isAdminMode, setIsAdminMode] = useState(false);

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
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [setsRefreshKey, setSetsRefreshKey] = useState(0);

  const timeSelectorRef = useRef<HTMLDivElement>(null);

  // 관리자 모드 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 모든 키 이벤트 로깅 (디버깅용)
      if (event.ctrlKey || event.shiftKey || event.metaKey) {
        console.log(`키 이벤트: ${event.key} (Ctrl: ${event.ctrlKey}, Shift: ${event.shiftKey}, Meta: ${event.metaKey})`);
      }

      // Ctrl + Shift + A 조합으로 관리자 모드 토글 (대소문자 관계없이)
      if (event.ctrlKey && event.shiftKey && (event.key === 'A' || event.key === 'a')) {
        event.preventDefault();
        console.log('🔑 관리자 모드 단축키 감지됨 (Ctrl+Shift+A)');
        toggleAdminMode();
        return;
      }

      // 대안 1: Ctrl + Alt + A 조합
      if (event.ctrlKey && event.altKey && (event.key === 'A' || event.key === 'a')) {
        event.preventDefault();
        console.log('🔑 관리자 모드 단축키 감지됨 (Ctrl+Alt+A)');
        toggleAdminMode();
        return;
      }

      // 대안 2: 특별한 키 시퀀스 (admin)
      // 키 시퀀스 처리는 필요시 추가할 수 있습니다.
    };

    console.log('🔧 키보드 이벤트 리스너 등록됨');
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('🔧 키보드 이벤트 리스너 해제됨');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 관리자 모드 토글
  const toggleAdminMode = useCallback(() => {
    setIsAdminMode(prev => {
      const newMode = !prev;
      if (newMode) {
        console.log('🔓 관리자 모드가 활성화되었습니다.');
        sessionStorage.setItem('adminMode', 'true');
        
        // GA4 이벤트 전송
        gtag_event('admin_mode_activate', {
          event_label: '관리자_모드_활성화',
          method: 'manual_toggle',
          timestamp: new Date().toISOString()
        });
        
        setTimeout(() => {
          console.log('✅ 관리자 모드 활성화 완료!');
          console.log('📊 "사용 통계" 버튼을 클릭하여 모든 사용자의 로그를 확인하세요.');
          console.log('🌍 이제 GA4에서도 실시간으로 모든 사용자 데이터를 확인할 수 있습니다!');
        }, 100);
      } else {
        console.log('🔒 관리자 모드가 비활성화되었습니다.');
        sessionStorage.removeItem('adminMode');
        setTimeout(() => {
          console.log('✅ 관리자 모드 비활성화 완료!');
        }, 100);
      }
      return newMode;
    });
    // 관리자 모드 토글 완료
  }, []);

  // 타이틀 클릭 핸들러 (히든 관리자 모드 접근)
  const handleTitleClick = () => {
    if (isAdminMode) {
      toggleAdminMode(); // 관리자 모드가 활성화되어 있으면 비활성화
    } else {
      // 관리자 모드 활성화 로직은 단순화
      toggleAdminMode();
    }
  };

  // 페이지 로드 시 세션에서 관리자 모드 상태 복원
  useEffect(() => {
    const savedAdminMode = sessionStorage.getItem('adminMode');
    if (savedAdminMode === 'true') {
      setIsAdminMode(true);
      console.log('🔓 관리자 모드가 복원되었습니다.');
    }

    // 개발자를 위한 관리자 모드 안내 (한 번만 표시)
    if (!localStorage.getItem('adminModeGuideShown')) {
      console.log('🔑 관리자 모드 접근 방법:');
      console.log('1. Ctrl + Shift + A (또는 Ctrl + Alt + A)');
      console.log('2. "admin" 키 순서대로 입력');
      console.log('3. 타이틀을 5번 연속 클릭');
      console.log('4. 콘솔에서 activateAdminMode() 직접 실행 ⭐ 추천!');
      console.log('');
      console.log('📊 관리자 모드에서는 로컬 + GA4 데이터를 모두 확인할 수 있습니다.');
      console.log('🌍 GA4 설정: docs/ga4-setup.md 참고');
      console.log('🚀 지금 바로 시도해보세요: activateAdminMode()');
      localStorage.setItem('adminModeGuideShown', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 관리자 모드 함수를 전역으로 노출
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowObj = window as unknown as { [key: string]: unknown };
      windowObj.toggleAdminMode = toggleAdminMode;
      windowObj.activateAdminMode = () => {
        setIsAdminMode(true);
        sessionStorage.setItem('adminMode', 'true');
        console.log('🔓 관리자 모드가 활성화되었습니다! (콘솔에서 실행됨)');
        console.log('📊 이제 화면 상단에 빨간색 관리자 모드 바가 나타납니다.');
        console.log('💡 "사용 통계" 버튼을 클릭하여 모든 사용자 로그를 확인하세요!');
        // 시각적 확인을 위한 임시 알림
        setTimeout(() => {
          if (document.querySelector('.admin-mode')) {
            console.log('✅ 관리자 모드 UI가 정상적으로 표시되었습니다!');
          } else {
            console.log('❌ 관리자 모드 UI 표시에 문제가 있을 수 있습니다.');
          }
        }, 500);
      };
      windowObj.deactivateAdminMode = () => {
        setIsAdminMode(false);
        sessionStorage.removeItem('adminMode');
        console.log('🔒 관리자 모드가 비활성화되었습니다!');
      };
      windowObj.checkAdminMode = () => {
        console.log(`현재 관리자 모드 상태: ${isAdminMode ? '🔓 활성화됨' : '🔒 비활성화됨'}`);
        return isAdminMode;
      };
    }
  }, [toggleAdminMode, isAdminMode]);

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
    
    // 작업 추가 로그
    logTaskAdd(task);
  };

  const handleTaskDelete = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    const filtered = tasks.filter(task => task.id !== id);
    const totalMinutes = calculateTotalMinutes();
    setTasks(calculatePercentagesFromMinutes(filtered, totalMinutes));
    
    // 작업 삭제 로그
    if (taskToDelete) {
      logTaskDelete(id, taskToDelete.name);
    }
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
    if (nextTaskIndex < tasks.length) {
      // 다음 작업으로 전환 (마지막 작업이 아닌 경우에만)
      setCurrentTaskId(tasks[nextTaskIndex].id);
    }
    // 타이머 완료 처리는 CircleTimer에서 총 시간 기준으로 처리
  };

  const handleTimerComplete = () => {
    // 타이머 완료 시 실제 종료 시간 기록
    const endTime = new Date();
    setActualEndTime(endTime);
    setIsComplete(true);
    setIsRunning(false); // 타이머 중지
    
    // 타이머 완료 로그
    if (startTime) {
      const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      logTimerComplete(initialTotalMinutes, tasks.length, actualDuration);
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
    
    // 타이머 시작 로그
    logTimerStart(totalMinutes, tasks.length);
  };

  const handleReset = () => {
    // 리셋 로그 (리셋 전에 기록)
    if (isRunning || isComplete) {
      logTimerReset(initialTotalMinutes, tasks.length);
    }
    
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
    
    // 작업 수정 로그
    logTaskUpdate(id, updates);
  };

  const handleSaveSet = (timerSet: TimerSet) => {
    const saved = localStorage.getItem('timerSets');
    const savedSets = saved ? JSON.parse(saved) : [];
    savedSets.push(timerSet);
    localStorage.setItem('timerSets', JSON.stringify(savedSets));
    setIsSaveFormVisible(false);
    setSetsRefreshKey(prev => prev + 1);
    
    // 세트 저장 로그
    logSetSave(timerSet);
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
    
    // 세트 로드 로그
    logSetLoad(timerSet);
  };

  const handleDeleteSet = (id: string) => {
    const saved = localStorage.getItem('timerSets');
    if (saved) {
      const savedSets = JSON.parse(saved);
      const setToDelete = savedSets.find((set: TimerSet) => set.id === id);
      const updated = savedSets.filter((set: TimerSet) => set.id !== id);
      localStorage.setItem('timerSets', JSON.stringify(updated));
      
      // 세트 삭제 로그
      if (setToDelete) {
        logSetDelete(id, setToDelete.name);
      }
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
    <main className={`container mx-auto max-w-2xl p-4 ${isAdminMode ? 'admin-mode' : ''}`} onClick={handleOutsideClick}>
      {/* 관리자 모드 전체 화면 표시 */}
      {isAdminMode && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <span className="font-bold">🔓 관리자 모드 활성화됨</span>
            <button
              onClick={toggleAdminMode}
              className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm transition-colors"
            >
              종료
            </button>
          </div>
        </div>
      )}

      {/* 상단 여백 (관리자 모드 바가 있을 때) */}
      <div className={isAdminMode ? 'mt-12' : ''}>
        <div className="flex items-center justify-center mb-8">
          <h1 
            className={`text-3xl font-bold text-center cursor-pointer select-none transition-colors ${
              isAdminMode ? 'text-red-600' : ''
            }`}
            onClick={handleTitleClick}
            title={isAdminMode ? "관리자 모드 활성화됨 - 클릭하여 종료" : "5번 클릭하면 관리자 모드"}
          >
            ⏱️ 시간분배 타이머 {isAdminMode ? '🔓' : ''}
          </h1>
          {isAdminMode && (
            <div className="ml-4 flex items-center">
              <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium animate-pulse">
                🔓 ADMIN
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mb-8">
        <CircleTimer
          tasks={tasks}
          isRunning={isRunning}
          totalMinutes={taskTotalMinutes}
          onTaskComplete={handleTaskComplete}
          onTimerComplete={handleTimerComplete}
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
          {isAdminMode && (
            <button
              onClick={() => setIsStatsVisible(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              📊 사용 통계
            </button>
          )}
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

      {/* 통계 모달 */}
      {isAdminMode && (
        <StatisticsView
          isVisible={isStatsVisible}
          onClose={() => setIsStatsVisible(false)}
        />
      )}
    </main>
  );
}
