import React, { useState, useEffect } from 'react';
import { LogService } from '@/utils/logService';
import type { UserStatistics } from '@/types/task';

interface StatisticsViewProps {
  isVisible: boolean;
  onClose: () => void;
}

export const StatisticsView = ({ isVisible, onClose }: StatisticsViewProps) => {
  const [overallStats, setOverallStats] = useState<UserStatistics | null>(null);
  const [todayStats, setTodayStats] = useState<UserStatistics | null>(null);
  const [globalStats, setGlobalStats] = useState<UserStatistics | null>(null);
  const [setAnalysis, setSetAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'today' | 'global' | 'sets'>('overall');

  useEffect(() => {
    if (isVisible) {
      loadStatistics();
    }
  }, [isVisible]);

  const loadStatistics = () => {
    const overall = LogService.getStatistics();
    const today = LogService.getTodayStatistics();
    const global = LogService.getGlobalStatistics();
    const sets = LogService.analyzeTimerSets();

    setOverallStats(overall);
    setTodayStats(today);
    setGlobalStats(global);
    setSetAnalysis(sets);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const exportData = () => {
    const data = LogService.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('모든 로그와 통계를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      LogService.clearLogs();
      loadStatistics();
      alert('로그가 삭제되었습니다.');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">📊 사용 통계</h2>
            <p className="text-sm text-gray-600 mt-1">
              로컬 데이터 + 🌍 GA4 실시간 수집 중
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'overall'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            내 통계
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'today'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            오늘 통계
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'global'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500'
            }`}
          >
            🌍 모든 사용자
          </button>
          <button
            onClick={() => setActiveTab('sets')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'sets'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            세트 분석
          </button>
        </div>

        {/* 전체 통계 */}
        {activeTab === 'overall' && overallStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">총 타이머 시작</h3>
                <p className="text-2xl font-bold text-blue-800">{overallStats.totalTimerStarts}회</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">완료한 타이머</h3>
                <p className="text-2xl font-bold text-green-800">{overallStats.totalTimerCompletions}회</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">완료율</h3>
                <p className="text-2xl font-bold text-purple-800">{overallStats.completionRate}%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">총 집중 시간</h3>
                <p className="text-2xl font-bold text-orange-800">{formatDuration(overallStats.totalTimerMinutes)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">평균 작업 수</h3>
                <p className="text-xl font-bold text-gray-800">{overallStats.averageTaskCount}개</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">저장된 세트</h3>
                <p className="text-xl font-bold text-gray-800">{overallStats.totalSetsCreated}개</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-600">사용 기간</h3>
              <p className="text-sm text-yellow-800">
                첫 사용: {formatDate(overallStats.firstUsed)}
              </p>
              <p className="text-sm text-yellow-800">
                마지막 사용: {formatDate(overallStats.lastUsed)}
              </p>
            </div>
          </div>
        )}

        {/* 오늘 통계 */}
        {activeTab === 'today' && todayStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">오늘 타이머 시작</h3>
                <p className="text-2xl font-bold text-blue-800">{todayStats.totalTimerStarts}회</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">오늘 완료</h3>
                <p className="text-2xl font-bold text-green-800">{todayStats.totalTimerCompletions}회</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">오늘 완료율</h3>
                <p className="text-2xl font-bold text-purple-800">{todayStats.completionRate}%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">오늘 집중 시간</h3>
                <p className="text-2xl font-bold text-orange-800">{formatDuration(todayStats.totalTimerMinutes)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">세트 생성</h3>
                <p className="text-xl font-bold text-gray-800">{todayStats.totalSetsCreated}개</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">세트 로드</h3>
                <p className="text-xl font-bold text-gray-800">{todayStats.totalSetsLoaded}개</p>
              </div>
            </div>

            {todayStats.totalTimerStarts === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>오늘은 아직 타이머를 사용하지 않았습니다.</p>
                <p>첫 타이머를 시작해보세요! 🚀</p>
              </div>
            )}
          </div>
        )}

        {/* 모든 사용자 통계 */}
        {activeTab === 'global' && globalStats && (
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-bold text-red-800 mb-2">🌍 전체 사용자 통계</h3>
              <p className="text-sm text-red-600">이 브라우저를 사용한 모든 사용자의 누적 데이터입니다.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-600">총 타이머 시작</h3>
                <p className="text-2xl font-bold text-red-800">{globalStats.totalTimerStarts}회</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">완료한 타이머</h3>
                <p className="text-2xl font-bold text-orange-800">{globalStats.totalTimerCompletions}회</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">전체 완료율</h3>
                <p className="text-2xl font-bold text-yellow-800">{globalStats.completionRate}%</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-pink-600">총 집중 시간</h3>
                <p className="text-2xl font-bold text-pink-800">{formatDuration(globalStats.totalTimerMinutes)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-600">평균 작업 수</h3>
                <p className="text-xl font-bold text-indigo-800">{globalStats.averageTaskCount}개</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">생성된 세트</h3>
                <p className="text-xl font-bold text-purple-800">{globalStats.totalSetsCreated}개</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">사용 기간</h3>
              <p className="text-sm text-gray-800">
                최초 사용: {formatDate(globalStats.firstUsed)}
              </p>
              <p className="text-sm text-gray-800">
                최근 사용: {formatDate(globalStats.lastUsed)}
              </p>
            </div>

            {/* 세션별 사용자 분석 */}
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">👥 세션별 사용자 분석</h3>
              {(() => {
                const globalLogs = LogService.getGlobalLogs();
                const sessionMap = new Map();
                
                globalLogs.forEach(log => {
                  const sessionId = log.data.sessionId;
                  if (sessionId) {
                    if (!sessionMap.has(sessionId)) {
                      sessionMap.set(sessionId, {
                        sessionId,
                        timerStarts: 0,
                        timerCompletions: 0,
                        firstSeen: log.timestamp,
                        lastSeen: log.timestamp,
                        browser: log.data.userAgent?.split(' ')[0] || 'Unknown',
                        timezone: log.data.timezone || 'Unknown'
                      });
                    }
                    
                    const session = sessionMap.get(sessionId);
                    if (log.type === 'timer_start') session.timerStarts++;
                    if (log.type === 'timer_complete') session.timerCompletions++;
                    if (log.timestamp > session.lastSeen) session.lastSeen = log.timestamp;
                    if (log.timestamp < session.firstSeen) session.firstSeen = log.timestamp;
                  }
                });

                const sessions = Array.from(sessionMap.values())
                  .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
                  .slice(0, 10); // 최근 10개 세션만 표시

                return sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map((session, index) => (
                      <div key={session.sessionId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">사용자 #{index + 1}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {session.browser} • {session.timezone}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {session.timerStarts}회 시작 • {session.timerCompletions}회 완료
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(session.lastSeen)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">세션 데이터가 없습니다.</p>
                );
              })()}
            </div>
          </div>
        )}

        {/* 세트 분석 */}
        {activeTab === 'sets' && setAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-600">총 저장된 세트</h3>
                <p className="text-2xl font-bold text-indigo-800">{setAnalysis.totalSets}개</p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-teal-600">평균 작업 수</h3>
                <p className="text-2xl font-bold text-teal-800">{setAnalysis.averageTasks}개</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-pink-600">평균 시간</h3>
                <p className="text-2xl font-bold text-pink-800">{formatDuration(setAnalysis.averageDuration)}</p>
              </div>
            </div>

            {setAnalysis.mostUsedSet && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">가장 많이 사용한 세트</h3>
                <p className="text-xl font-bold text-yellow-800">{setAnalysis.mostUsedSet}</p>
              </div>
            )}

            {Object.keys(setAnalysis.setUsageCount).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3">세트별 사용 횟수</h3>
                <div className="space-y-2">
                  {Object.entries(setAnalysis.setUsageCount)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([setId, count]) => (
                    <div key={String(setId)} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{String(setId)}</span>
                      <span className="text-sm font-medium text-gray-800">{Number(count)}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {setAnalysis.totalSets === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>아직 저장된 타이머 세트가 없습니다.</p>
                <p>자주 사용하는 설정을 저장해보세요! 💾</p>
              </div>
            )}
          </div>
        )}

        {/* GA4 안내 */}
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">🌍 Google Analytics 4</h3>
          <p className="text-sm text-blue-700 mb-3">
            현재 모든 사용자 활동이 GA4로 실시간 전송되고 있습니다.
          </p>
          <div className="flex gap-2">
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              📈 GA4 대시보드 열기
            </a>
            <button
              onClick={() => window.open('/docs/ga4-setup.md', '_blank')}
              className="bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              📋 설정 가이드
            </button>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex justify-center gap-4 mt-8 pt-6 border-t">
          <button
            onClick={exportData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            📥 로컬 데이터 내보내기
          </button>
          <button
            onClick={clearData}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            🗑️ 로컬 로그 삭제
          </button>
          <button
            onClick={loadStatistics}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            🔄 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}; 