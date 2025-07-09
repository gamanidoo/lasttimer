export interface Task {
  id: string;
  name: string;
  percentage: number;  // 필수 필드로 변경
  minutes?: number;     // 분 단위 시간 (선택적)
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