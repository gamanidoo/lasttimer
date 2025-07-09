import type { Task } from '../types/task';

// 시간 기반 비율 계산 함수 (마지막 작업 보정)
export function calculateTaskPercentages(tasks: Task[], totalMinutes: number): number[] {
  if (tasks.length === 0) return [];
  
  let sum = 0;
  return tasks.map((task, idx) => {
    if (idx === tasks.length - 1) {
      // 마지막 작업은 남은 비율로 보정
      return Math.max(0, 100 - sum);
    }
    const percent = Math.round(((task.minutes ?? 0) / totalMinutes) * 1000) / 10;
    sum += percent;
    return percent;
  });
}

// 작업들을 총 시간에 맞게 비율 계산하여 업데이트
export function updateTasksWithPercentages(tasks: Task[], totalMinutes: number): Task[] {
  if (tasks.length === 0) return [];
  
  const percentages = calculateTaskPercentages(tasks, totalMinutes);
  
  return tasks.map((task, idx) => ({
    ...task,
    percentage: percentages[idx],
    minutes: Math.round((percentages[idx] / 100) * totalMinutes)
  }));
}

// 경과 시간 기준 현재 작업 인덱스 계산
export function getCurrentTaskIndex(tasks: Task[], elapsedMinutes: number): number {
  let accumulatedMinutes = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    const taskMinutes = typeof tasks[i].minutes === 'number' ? tasks[i].minutes! : 0;
    if (elapsedMinutes < accumulatedMinutes + taskMinutes) {
      return i;
    }
    accumulatedMinutes += taskMinutes;
  }
  
  return tasks.length - 1;
}

// 시간 포맷팅 함수
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}

// 시간 텍스트 포맷팅 (HH:MM 형식)
export function formatTimeText(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 총 시간 계산 함수
export function calculateTotalMinutes(endTime: { hours: number; minutes: number }): number {
  const now = new Date();
  const end = new Date();
  end.setHours(endTime.hours);
  end.setMinutes(endTime.minutes);
  
  // 종료 시간이 현재 시간보다 이전이면 다음 날로 설정
  if (end < now) {
    end.setDate(end.getDate() + 1);
  }
  
  return Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
}

// 작업 완료 여부 확인
export function isTaskCompleted(task: Task, elapsedMinutes: number, startTime: Date): boolean {
  const taskStartTime = getTaskStartTime(task, startTime);
  const taskEndTime = new Date(taskStartTime.getTime() + (task.minutes ?? 0) * 60 * 1000);
  return new Date() >= taskEndTime;
}

// 작업 시작 시간 계산
export function getTaskStartTime(task: Task, startTime: Date): Date {
  // 실제로는 tasks 배열에서 인덱스를 찾아서 계산해야 함
  // 임시로 startTime 반환
  return startTime;
}

// 랜덤 색상 생성
export function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD166', '#8338EC',
    '#FF9F1C', '#118AB2', '#06D6A0', '#EF476F', '#073B4C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 작업 검증 함수 (수정됨)
export function validateTask(task: Task, totalMinutes: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!task.name.trim()) {
    errors.push('작업 이름을 입력해주세요.');
  }

  if (typeof task.minutes !== 'number' || isNaN(task.minutes)) {
    errors.push('작업 시간을 올바르게 입력해주세요.');
  } else {
    if (task.minutes <= 0) {
      errors.push('작업 시간은 0보다 커야 합니다.');
    }
    if (task.minutes > totalMinutes) {
      errors.push('작업 시간이 총 시간을 초과할 수 없습니다.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
