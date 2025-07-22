export interface Task {
  id: string;
  name: string;
  percentage: number;  // 필수 필드로 변경
  minutes?: number;     // 분 단위 시간 (선택적)
  seconds?: number;     // 초 단위 시간 (선택적) - 30초 같은 짧은 시간 지원
  duration?: number;    // 실제 할당된 시간(분)
  color: string;
  isManual?: boolean;  // 수동조정 여부
}

export interface TimerSet {
  id: string;
  name: string;
  endTime?: { hours: number; minutes: number };
  tasks: Task[];
  totalMinutes: number;
  createdAt: Date;
}

// 로그 관련 타입 정의
export type LogEventType = 
  | 'timer_start'
  | 'timer_complete' 
  | 'timer_reset'
  | 'set_save'
  | 'set_load'
  | 'set_delete'
  | 'task_add'
  | 'task_delete'
  | 'task_update';

export interface LogEvent {
  id: string;
  type: LogEventType;
  timestamp: Date;
  data: {
    // 타이머 관련
    timerDuration?: number; // 분 단위
    taskCount?: number;
    completionRate?: number; // 0-100
    
    // 세트 관련
    setId?: string;
    setName?: string;
    
    // 작업 관련
    taskId?: string;
    taskName?: string;
    
    // 추가 메타데이터
    [key: string]: any;
  };
}

export interface UserStatistics {
  totalTimerStarts: number;
  totalTimerCompletions: number;
  totalTimerMinutes: number;
  completionRate: number; // 0-100
  totalSetsCreated: number;
  totalSetsLoaded: number;
  averageTaskCount: number;
  firstUsed: Date;
  lastUsed: Date;
} 