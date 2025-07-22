// Google Analytics 4 설정
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-TEST123456';

// 개발 환경에서 GA4 테스트 여부 확인
export const isGAEnabled = () => {
  return GA_TRACKING_ID !== 'G-TEST123456' && GA_TRACKING_ID !== 'G-XXXXXXXXXX';
};

// 개발 환경 로깅
if (typeof window !== 'undefined' && !isGAEnabled()) {
  console.log('🔧 GA4 개발 모드: 실제 GA4로 전송되지 않습니다.');
  console.log('📋 설정 방법: docs/ga4-setup.md 참고');
}

// GA4 이벤트 타입 정의
export type GAEventType = 
  | 'timer_start'
  | 'timer_complete' 
  | 'timer_reset'
  | 'set_save'
  | 'set_load'
  | 'set_delete'
  | 'task_add'
  | 'task_delete'
  | 'task_update'
  | 'admin_mode_activate';

// GA4 이벤트 파라미터 타입 정의
export interface GAEventParameters {
  // 기본 이벤트 파라미터
  event_category?: string;
  event_label?: string;
  value?: number;
  
  // 타이머 관련 파라미터
  task_name?: string;
  task_duration?: number;
  task_position?: number;
  total_tasks?: number;
  completion_rate?: number;
  actual_duration?: number;
  
  // 세트 관련 파라미터
  set_name?: string;
  set_id?: string;
  tasks_count?: number;
  
  // 사용자 환경 정보
  user_session_id?: string;
  browser_info?: string;
  screen_resolution?: string;
  
  // 커스텀 파라미터
  [key: string]: string | number | boolean | undefined;
}

// GA4 페이지뷰 추적
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// GA4 이벤트 추적
export const event = (
  action: GAEventType,
  parameters: GAEventParameters = {}
) => {
  // 개발 모드에서는 콘솔에만 로그
  if (!isGAEnabled()) {
    console.log(`[GA4 개발모드] ${action}:`, parameters);
    return;
  }

  // 실제 GA4로 전송
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'timer_app',
      ...parameters,
    });
  }
};

// GA4 사용자 속성 타입 정의
export interface GAUserProperties {
  user_type?: 'new_user' | 'returning_user';
  preferred_timer_duration?: string;
  avg_tasks_per_session?: number;
  [key: string]: string | number | boolean | undefined;
}

// GA4 사용자 속성 설정
export const setUserProperties = (properties: GAUserProperties) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
};

// GA4 글로벌 타입 정의
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string | GAEventType,
      parameters?: GAEventParameters | GAUserProperties
    ) => void;
  }
} 