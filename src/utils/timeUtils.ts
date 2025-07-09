// 분을 초로 변환
export function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

// 초를 분으로 변환  
export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

// 시간을 사람이 읽기 좋은 형태로 포맷팅
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}초`);
  
  return parts.join(' ');
}

// 간단한 포맷팅 (작업 목록용)
export function formatDurationSimple(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0 && seconds > 0) {
    return `${minutes}분 ${seconds}초`;
  } else if (minutes > 0) {
    return `${minutes}분`;
  } else {
    return `${seconds}초`;
  }
}

// MM:SS 형태로 포맷팅 (타이머 디스플레이용)
export function formatTimeDisplay(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 