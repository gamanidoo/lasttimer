import type { TimerSet } from '@/types/task';

/**
 * 🆕 완전히 새로운 단순한 공유 기능
 * - Base64 인코딩만 사용 (한국어 안전 처리)
 * - 복잡한 압축/fallback 제거
 * - 투명하고 디버깅 가능한 방식
 */

/**
 * 타이머 세트를 공유 URL로 변환
 */
export function createShareUrl(timerSet: TimerSet): string {
  try {
    // 공유할 데이터만 추출 (불필요한 메타데이터 제거)
    const shareData = {
      name: timerSet.name,
      tasks: timerSet.tasks.map(task => ({
        name: task.name,
        minutes: task.minutes || task.duration || 0,
        color: task.color
      })),
      totalMinutes: timerSet.totalMinutes
    };

    // JSON 문자열로 변환
    const jsonString = JSON.stringify(shareData);
    console.log('📦 공유 데이터:', jsonString);

    // Base64 인코딩 (한국어 안전 처리)
    const encoded = btoa(encodeURIComponent(jsonString));
    console.log('🔐 인코딩 완료:', encoded.length, '글자');

    // URL 생성
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/?share=${encoded}`;
    
    console.log('🔗 공유 URL 생성 완료:', shareUrl);
    return shareUrl;

  } catch (error) {
    console.error('❌ 공유 URL 생성 실패:', error);
    throw new Error('공유 URL을 생성할 수 없습니다.');
  }
}

/**
 * 공유 URL에서 타이머 세트 파싱
 */
export function parseSharedTimerSet(shareParam: string): TimerSet | null {
  try {
    console.log('🔍 공유 파라미터 파싱 시작:', shareParam);

    // Base64 디코딩
    const decoded = decodeURIComponent(atob(shareParam));
    console.log('🔓 디코딩 완료:', decoded);

    // JSON 파싱
    const shareData = JSON.parse(decoded);
    console.log('📋 파싱된 데이터:', shareData);

    // 유효성 검사
    if (!shareData.name || !Array.isArray(shareData.tasks)) {
      throw new Error('잘못된 공유 데이터 형식');
    }

    // TimerSet 형식으로 변환
    const timerSet: TimerSet = {
      id: `shared-${Date.now()}`,
      name: shareData.name,
      tasks: shareData.tasks.map((task: any, index: number) => ({
        id: `shared-task-${index}`,
        name: task.name,
        minutes: task.minutes,
        duration: task.minutes,
        percentage: Math.round((task.minutes / shareData.totalMinutes) * 1000) / 10,
        color: task.color
      })),
      totalMinutes: shareData.totalMinutes,
      createdAt: new Date()
    };

    console.log('✅ 타이머 세트 변환 완료:', timerSet);
    return timerSet;

  } catch (error) {
    console.error('❌ 공유 URL 파싱 실패:', error);
    return null;
  }
}

/**
 * 클립보드에 텍스트 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log('📋 클립보드 복사 성공 (Clipboard API)');
      return true;
    } else {
      // 폴백 방식
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      console.log('📋 클립보드 복사 성공 (폴백)');
      return success;
    }
  } catch (error) {
    console.error('❌ 클립보드 복사 실패:', error);
    return false;
  }
}

/**
 * URL에서 공유 파라미터 추출
 */
export function getShareParamFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('share');
}