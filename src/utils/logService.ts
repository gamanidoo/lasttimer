import type { LogEvent, LogEventType, UserStatistics, TimerSet, Task } from '@/types/task';
import { event as gtag_event, setUserProperties } from '@/utils/gtag';

const LOG_STORAGE_KEY = 'timerAppLogs';
const STATS_STORAGE_KEY = 'timerAppStats';
const GLOBAL_LOG_STORAGE_KEY = 'timerAppGlobalLogs';
const GLOBAL_STATS_STORAGE_KEY = 'timerAppGlobalStats';

export class LogService {
  /**
   * 사용자 세션 ID 생성 또는 가져오기
   */
  private static getUserSessionId(): string {
    let sessionId = sessionStorage.getItem('userSessionId');
    if (!sessionId) {
      sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('userSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * 브라우저 정보 수집
   */
  private static getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * 로그 이벤트를 기록합니다 (로컬 + GA4)
   */
  static logEvent(type: LogEventType, data: LogEvent['data'] = {}): void {
    try {
      const sessionId = this.getUserSessionId();
      const browserInfo = this.getBrowserInfo();
      
      const logEvent: LogEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        timestamp: new Date(),
        data: {
          ...data,
          sessionId,
          ...browserInfo
        }
      };

      // 1. 로컬 스토리지에 저장 (기존 방식 유지)
      const existingLogs = this.getLogs();
      existingLogs.push(logEvent);
      const trimmedLogs = existingLogs.slice(-1000);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));

      // 글로벌 로그 저장 (모든 사용자 공통)
      this.saveGlobalLog(logEvent);

      // 통계 업데이트
      this.updateStatistics(logEvent);
      this.updateGlobalStatistics(logEvent);

      // 2. Google Analytics 4로 이벤트 전송 🚀
      this.sendToGA4(type, logEvent);

      console.log(`[타이머 로그] ${type}:`, data);
    } catch (error) {
      console.error('로그 기록 실패:', error);
    }
  }

  /**
   * GA4로 이벤트 전송
   */
  private static sendToGA4(type: LogEventType, logEvent: LogEvent): void {
    try {
      // GA4 이벤트 파라미터 구성
      const gaParams: any = {
        user_session_id: logEvent.data.sessionId,
        browser_info: logEvent.data.userAgent?.split(' ')[0] || 'Unknown',
        screen_resolution: logEvent.data.screenResolution,
        timezone: logEvent.data.timezone,
        timestamp: logEvent.timestamp.toISOString(),
      };

      // 이벤트 타입별 특화 파라미터 추가
      switch (type) {
        case 'timer_start':
          gaParams.timer_duration = logEvent.data.timerDuration;
          gaParams.task_count = logEvent.data.taskCount;
          gaParams.event_label = `${logEvent.data.timerDuration}분_${logEvent.data.taskCount}작업`;
          break;

        case 'timer_complete':
          gaParams.timer_duration = logEvent.data.timerDuration;
          gaParams.task_count = logEvent.data.taskCount;
          gaParams.completion_rate = logEvent.data.completionRate;
          gaParams.actual_duration = logEvent.data.actualDuration;
          gaParams.value = logEvent.data.completionRate; // GA4 값으로 완료율 설정
          gaParams.event_label = `완료율_${logEvent.data.completionRate}%`;
          break;

        case 'timer_reset':
          gaParams.timer_duration = logEvent.data.timerDuration;
          gaParams.task_count = logEvent.data.taskCount;
          gaParams.event_label = '타이머_중단';
          break;

        case 'set_save':
          gaParams.set_name = logEvent.data.setName;
          gaParams.task_count = logEvent.data.taskCount;
          gaParams.timer_duration = logEvent.data.timerDuration;
          gaParams.event_label = `세트저장_${logEvent.data.setName}`;
          break;

        case 'set_load':
          gaParams.set_name = logEvent.data.setName;
          gaParams.task_count = logEvent.data.taskCount;
          gaParams.timer_duration = logEvent.data.timerDuration;
          gaParams.event_label = `세트로드_${logEvent.data.setName}`;
          break;

        case 'set_delete':
          gaParams.set_name = logEvent.data.setName;
          gaParams.event_label = `세트삭제_${logEvent.data.setName}`;
          break;

        case 'task_add':
          gaParams.task_name = logEvent.data.taskName;
          gaParams.task_duration = logEvent.data.taskDuration;
          gaParams.event_label = `작업추가_${logEvent.data.taskName}`;
          break;

        case 'task_delete':
          gaParams.task_name = logEvent.data.taskName;
          gaParams.event_label = `작업삭제_${logEvent.data.taskName}`;
          break;

        case 'task_update':
          gaParams.task_name = logEvent.data.taskName;
          gaParams.event_label = '작업수정';
          break;
      }

      // GA4로 이벤트 전송
      gtag_event(type, gaParams);

      console.log(`[GA4 전송] ${type}:`, gaParams);
    } catch (error) {
      console.error('GA4 전송 실패:', error);
    }
  }

  /**
   * 글로벌 로그 저장
   */
  private static saveGlobalLog(logEvent: LogEvent): void {
    try {
      const globalLogs = this.getGlobalLogs();
      globalLogs.push(logEvent);
      
      // 글로벌 로그는 최근 5000개까지 유지
      const trimmedGlobalLogs = globalLogs.slice(-5000);
      localStorage.setItem(GLOBAL_LOG_STORAGE_KEY, JSON.stringify(trimmedGlobalLogs));
    } catch (error) {
      console.error('글로벌 로그 저장 실패:', error);
    }
  }

  /**
   * 모든 로그를 가져옵니다 (개인)
   */
  static getLogs(): LogEvent[] {
    try {
      const logs = localStorage.getItem(LOG_STORAGE_KEY);
      if (!logs) return [];
      
      return JSON.parse(logs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      console.error('로그 로드 실패:', error);
      return [];
    }
  }

  /**
   * 글로벌 로그를 가져옵니다 (모든 사용자)
   */
  static getGlobalLogs(): LogEvent[] {
    try {
      const logs = localStorage.getItem(GLOBAL_LOG_STORAGE_KEY);
      if (!logs) return [];
      
      return JSON.parse(logs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      console.error('글로벌 로그 로드 실패:', error);
      return [];
    }
  }

  /**
   * 특정 기간의 로그를 가져옵니다
   */
  static getLogsByDateRange(startDate: Date, endDate: Date): LogEvent[] {
    const logs = this.getLogs();
    return logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * 특정 타입의 로그를 가져옵니다
   */
  static getLogsByType(type: LogEventType): LogEvent[] {
    const logs = this.getLogs();
    return logs.filter(log => log.type === type);
  }

  /**
   * 사용자 통계를 업데이트합니다
   */
  private static updateStatistics(newLog: LogEvent): void {
    try {
      const stats = this.getStatistics();
      const allLogs = this.getLogs();

      // 기본 카운터 업데이트
      switch (newLog.type) {
        case 'timer_start':
          stats.totalTimerStarts++;
          if (newLog.data.timerDuration) {
            stats.totalTimerMinutes += newLog.data.timerDuration;
          }
          break;
        
        case 'timer_complete':
          stats.totalTimerCompletions++;
          break;
        
        case 'set_save':
          stats.totalSetsCreated++;
          break;
        
        case 'set_load':
          stats.totalSetsLoaded++;
          break;
      }

      // 완료율 계산
      stats.completionRate = stats.totalTimerStarts > 0 
        ? Math.round((stats.totalTimerCompletions / stats.totalTimerStarts) * 100)
        : 0;

      // 평균 작업 수 계산
      const timerStartLogs = allLogs.filter(log => log.type === 'timer_start');
      const totalTasks = timerStartLogs.reduce((sum, log) => sum + (log.data.taskCount || 0), 0);
      stats.averageTaskCount = timerStartLogs.length > 0 
        ? Math.round((totalTasks / timerStartLogs.length) * 10) / 10
        : 0;

      // 첫 사용일과 마지막 사용일 업데이트
      if (allLogs.length > 0) {
        const sortedLogs = allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        stats.firstUsed = sortedLogs[0].timestamp;
        stats.lastUsed = sortedLogs[sortedLogs.length - 1].timestamp;
      }

      // 통계 저장
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('통계 업데이트 실패:', error);
    }
  }

  /**
   * 글로벌 통계를 업데이트합니다
   */
  private static updateGlobalStatistics(newLog: LogEvent): void {
    try {
      const stats = this.getGlobalStatistics();
      const allLogs = this.getGlobalLogs();

      // 기본 카운터 업데이트
      switch (newLog.type) {
        case 'timer_start':
          stats.totalTimerStarts++;
          if (newLog.data.timerDuration) {
            stats.totalTimerMinutes += newLog.data.timerDuration;
          }
          break;
        
        case 'timer_complete':
          stats.totalTimerCompletions++;
          break;
        
        case 'set_save':
          stats.totalSetsCreated++;
          break;
        
        case 'set_load':
          stats.totalSetsLoaded++;
          break;
      }

      // 완료율 계산
      stats.completionRate = stats.totalTimerStarts > 0 
        ? Math.round((stats.totalTimerCompletions / stats.totalTimerStarts) * 100)
        : 0;

      // 평균 작업 수 계산
      const timerStartLogs = allLogs.filter(log => log.type === 'timer_start');
      const totalTasks = timerStartLogs.reduce((sum, log) => sum + (log.data.taskCount || 0), 0);
      stats.averageTaskCount = timerStartLogs.length > 0 
        ? Math.round((totalTasks / timerStartLogs.length) * 10) / 10
        : 0;

      // 첫 사용일과 마지막 사용일 업데이트
      if (allLogs.length > 0) {
        const sortedLogs = allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        stats.firstUsed = sortedLogs[0].timestamp;
        stats.lastUsed = sortedLogs[sortedLogs.length - 1].timestamp;
      }

      // 글로벌 통계 저장
      localStorage.setItem(GLOBAL_STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('글로벌 통계 업데이트 실패:', error);
    }
  }

  /**
   * 사용자 통계를 가져옵니다
   */
  static getStatistics(): UserStatistics {
    try {
      const stats = localStorage.getItem(STATS_STORAGE_KEY);
      if (!stats) {
        // 기본 통계 객체 반환
        const defaultStats: UserStatistics = {
          totalTimerStarts: 0,
          totalTimerCompletions: 0,
          totalTimerMinutes: 0,
          completionRate: 0,
          totalSetsCreated: 0,
          totalSetsLoaded: 0,
          averageTaskCount: 0,
          firstUsed: new Date(),
          lastUsed: new Date()
        };
        return defaultStats;
      }
      
      const parsed = JSON.parse(stats);
      return {
        ...parsed,
        firstUsed: new Date(parsed.firstUsed),
        lastUsed: new Date(parsed.lastUsed)
      };
    } catch (error) {
      console.error('통계 로드 실패:', error);
      return {
        totalTimerStarts: 0,
        totalTimerCompletions: 0,
        totalTimerMinutes: 0,
        completionRate: 0,
        totalSetsCreated: 0,
        totalSetsLoaded: 0,
        averageTaskCount: 0,
        firstUsed: new Date(),
        lastUsed: new Date()
      };
    }
  }

  /**
   * 글로벌 통계를 가져옵니다 (모든 사용자)
   */
  static getGlobalStatistics(): UserStatistics {
    try {
      const stats = localStorage.getItem(GLOBAL_STATS_STORAGE_KEY);
      if (!stats) {
        // 기본 통계 객체 반환
        const defaultStats: UserStatistics = {
          totalTimerStarts: 0,
          totalTimerCompletions: 0,
          totalTimerMinutes: 0,
          completionRate: 0,
          totalSetsCreated: 0,
          totalSetsLoaded: 0,
          averageTaskCount: 0,
          firstUsed: new Date(),
          lastUsed: new Date()
        };
        return defaultStats;
      }
      
      const parsed = JSON.parse(stats);
      return {
        ...parsed,
        firstUsed: new Date(parsed.firstUsed),
        lastUsed: new Date(parsed.lastUsed)
      };
    } catch (error) {
      console.error('글로벌 통계 로드 실패:', error);
      return {
        totalTimerStarts: 0,
        totalTimerCompletions: 0,
        totalTimerMinutes: 0,
        completionRate: 0,
        totalSetsCreated: 0,
        totalSetsLoaded: 0,
        averageTaskCount: 0,
        firstUsed: new Date(),
        lastUsed: new Date()
      };
    }
  }

  /**
   * 오늘의 통계를 가져옵니다
   */
  static getTodayStatistics(): UserStatistics {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayLogs = this.getLogsByDateRange(today, tomorrow);
    
    const timerStarts = todayLogs.filter(log => log.type === 'timer_start').length;
    const timerCompletions = todayLogs.filter(log => log.type === 'timer_complete').length;
    const setsCreated = todayLogs.filter(log => log.type === 'set_save').length;
    const setsLoaded = todayLogs.filter(log => log.type === 'set_load').length;
    
    const totalMinutes = todayLogs
      .filter(log => log.type === 'timer_start')
      .reduce((sum, log) => sum + (log.data.timerDuration || 0), 0);

    return {
      totalTimerStarts: timerStarts,
      totalTimerCompletions: timerCompletions,
      totalTimerMinutes: totalMinutes,
      completionRate: timerStarts > 0 ? Math.round((timerCompletions / timerStarts) * 100) : 0,
      totalSetsCreated: setsCreated,
      totalSetsLoaded: setsLoaded,
      averageTaskCount: 0, // 오늘 통계에서는 생략
      firstUsed: today,
      lastUsed: new Date()
    };
  }

  /**
   * 저장된 타이머 세트 정보를 분석합니다
   */
  static analyzeTimerSets(): {
    totalSets: number;
    mostUsedSet: string | null;
    averageTasks: number;
    averageDuration: number;
    setUsageCount: { [setId: string]: number };
  } {
    try {
      const savedSets = localStorage.getItem('timerSets');
      const sets: TimerSet[] = savedSets ? JSON.parse(savedSets) : [];
      
      const loadLogs = this.getLogsByType('set_load');
      const setUsageCount: { [setId: string]: number } = {};
      
      // 각 세트의 사용 횟수 계산
      loadLogs.forEach(log => {
        if (log.data.setId) {
          setUsageCount[log.data.setId] = (setUsageCount[log.data.setId] || 0) + 1;
        }
      });
      
      // 가장 많이 사용된 세트 찾기
      let mostUsedSet: string | null = null;
      let maxUsage = 0;
      Object.entries(setUsageCount).forEach(([setId, count]) => {
        if (count > maxUsage) {
          maxUsage = count;
          const set = sets.find(s => s.id === setId);
          mostUsedSet = set?.name || setId;
        }
      });
      
      // 평균 작업 수와 지속시간 계산
      const totalTasks = sets.reduce((sum, set) => sum + set.tasks.length, 0);
      const totalDuration = sets.reduce((sum, set) => sum + set.totalMinutes, 0);
      
      return {
        totalSets: sets.length,
        mostUsedSet,
        averageTasks: sets.length > 0 ? Math.round((totalTasks / sets.length) * 10) / 10 : 0,
        averageDuration: sets.length > 0 ? Math.round((totalDuration / sets.length) * 10) / 10 : 0,
        setUsageCount
      };
    } catch (error) {
      console.error('타이머 세트 분석 실패:', error);
      return {
        totalSets: 0,
        mostUsedSet: null,
        averageTasks: 0,
        averageDuration: 0,
        setUsageCount: {}
      };
    }
  }

  /**
   * 로그를 초기화합니다 (개발/테스트 목적)
   */
  static clearLogs(): void {
    localStorage.removeItem(LOG_STORAGE_KEY);
    localStorage.removeItem(STATS_STORAGE_KEY);
    console.log('로그가 초기화되었습니다.');
  }

  /**
   * 로그를 JSON 형태로 내보냅니다
   */
  static exportLogs(): string {
    const logs = this.getLogs();
    const stats = this.getStatistics();
    const setAnalysis = this.analyzeTimerSets();
    
    return JSON.stringify({
      exportDate: new Date(),
      logs,
      statistics: stats,
      timerSetAnalysis: setAnalysis
    }, null, 2);
  }
}

// 편의 함수들
export const logTimerStart = (duration: number, taskCount: number) => {
  LogService.logEvent('timer_start', {
    timerDuration: duration,
    taskCount
  });
};

export const logTimerComplete = (duration: number, taskCount: number, actualDuration?: number) => {
  const completionRate = actualDuration && duration > 0 
    ? Math.min(Math.round((actualDuration / duration) * 100), 100)
    : 100;
    
  LogService.logEvent('timer_complete', {
    timerDuration: duration,
    taskCount,
    actualDuration,
    completionRate
  });
};

export const logTimerReset = (duration: number, taskCount: number) => {
  LogService.logEvent('timer_reset', {
    timerDuration: duration,
    taskCount
  });
};

export const logSetSave = (set: TimerSet) => {
  LogService.logEvent('set_save', {
    setId: set.id,
    setName: set.name,
    taskCount: set.tasks.length,
    timerDuration: set.totalMinutes
  });
};

export const logSetLoad = (set: TimerSet) => {
  LogService.logEvent('set_load', {
    setId: set.id,
    setName: set.name,
    taskCount: set.tasks.length,
    timerDuration: set.totalMinutes
  });
};

export const logSetDelete = (setId: string, setName?: string) => {
  LogService.logEvent('set_delete', {
    setId,
    setName
  });
};

export const logTaskAdd = (task: Partial<Task>) => {
  LogService.logEvent('task_add', {
    taskId: task.id,
    taskName: task.name,
    taskDuration: task.duration || task.minutes
  });
};

export const logTaskDelete = (taskId: string, taskName?: string) => {
  LogService.logEvent('task_delete', {
    taskId,
    taskName
  });
};

export const logTaskUpdate = (taskId: string, updates: Partial<Task>) => {
  LogService.logEvent('task_update', {
    taskId,
    updates: Object.keys(updates)
  });
}; 