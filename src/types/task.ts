export interface Task {
  id: string;
  name: string;
  percentage: number;
  duration?: number; // 실제 할당된 시간(분)
  color: string;
} 