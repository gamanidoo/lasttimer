import { useState, useEffect } from 'react';
import type { TimerSet, Task } from '../types/task';
import { createShareUrl, copyToClipboard } from '@/utils/shareUtils';
import { event as gtag_event } from '@/utils/gtag';

interface SavedSetsProps {
  onLoadSet: (timerSet: TimerSet) => void;
  onDeleteSet: (id: string) => void;
  refreshKey: number;
}

export const SavedSets = ({ onLoadSet, onDeleteSet, refreshKey }: SavedSetsProps) => {
  const [savedSets, setSavedSets] = useState<TimerSet[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TimerSet> | null>(null);
  const [shareMessage, setShareMessage] = useState<string>('');

  useEffect(() => {
    const loadSavedSets = () => {
      try {
        const saved = localStorage.getItem('timerSets');
        if (saved) {
          const parsed = JSON.parse(saved) as TimerSet[];
          setSavedSets(parsed);
        }
      } catch (error) {
        console.error('저장된 세트를 불러오는 중 오류가 발생했습니다:', error);
      }
    };

    loadSavedSets();
  }, [refreshKey]);

  const handleDeleteSet = (id: string) => {
    onDeleteSet(id);
  };

  const handleEdit = (set: TimerSet) => {
    setEditId(set.id);
    setEditData({ ...set, tasks: set.tasks.map(task => ({ ...task })) });
  };

  const handleEditChange = (field: keyof TimerSet, value: string | number | { hours: number; minutes: number }) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleEditTaskChange = (idx: number, field: keyof Task, value: string | number) => {
    setEditData(prev => {
      if (!prev || !prev.tasks) return prev;
      const newTasks = prev.tasks.map((t, i) => i === idx ? { ...t, [field]: value } : t);
      return { ...prev, tasks: newTasks };
    });
  };

  const handleEditSave = () => {
    if (!editId || !editData) return;
    const updatedSets = savedSets.map(set => set.id === editId ? {
      ...set,
      ...editData,
      tasks: editData.tasks || set.tasks,
      createdAt: set.createdAt // 저장일시는 기존 유지
    } : set);
    setSavedSets(updatedSets);
    localStorage.setItem('timerSets', JSON.stringify(updatedSets));
    setEditId(null);
    setEditData(null);
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditData(null);
  };

  const formatTime = (time: { hours: number; minutes: number }) => {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
  };

  // 🆕 새로운 간단한 공유 핸들러
  const handleShare = async (timerSet: TimerSet) => {
    try {
      console.log('🚀 저장된 세트 공유 시작:', timerSet.name);
      
      const shareUrl = createShareUrl(timerSet);
      const success = await copyToClipboard(shareUrl);
      
      if (success) {
        setShareMessage('✅ 공유 링크가 클립보드에 복사되었습니다!');
        console.log('✅ 공유 URL:', shareUrl);
        
        // GA4 이벤트 로깅
        gtag_event('set_share_copy', {
          event_label: '세트_공유_복사',
          set_name: timerSet.name,
          task_count: timerSet.tasks.length,
          total_minutes: timerSet.totalMinutes
        });
      } else {
        setShareMessage('❌ 클립보드 복사에 실패했습니다.');
      }
      
      // 3초 후 메시지 제거
      setTimeout(() => setShareMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ 공유 실패:', error);
      setShareMessage('❌ 공유 링크 생성에 실패했습니다.');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        저장된 세트 불러오기
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">저장된 타이머 세트</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* 공유 메시지 */}
        {shareMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{shareMessage}</p>
          </div>
        )}
        
        {savedSets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">저장된 세트가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {savedSets.map((set) => (
              <div
                key={set.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {editId === set.id ? (
                  <div>
                    <input
                      type="text"
                      value={editData?.name ?? ''}
                      onChange={e => handleEditChange('name', e.target.value)}
                      className="w-full mb-2 px-2 py-1 border rounded text-black"
                      placeholder="세트 이름"
                    />
                    <div className="mb-1 font-medium text-black">종료 시각</div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        value={editData?.endTime?.hours ?? 0}
                        min={0}
                        max={23}
                        onChange={e => handleEditChange('endTime', { hours: Number(e.target.value), minutes: editData?.endTime?.minutes ?? 0 })}
                        className="w-16 px-2 py-1 border rounded text-black"
                        placeholder="시"
                      />
                      <input
                        type="number"
                        value={editData?.endTime?.minutes ?? 0}
                        min={0}
                        max={59}
                        onChange={e => handleEditChange('endTime', { hours: editData?.endTime?.hours ?? 0, minutes: Number(e.target.value) })}
                        className="w-16 px-2 py-1 border rounded text-black"
                        placeholder="분"
                      />
                    </div>
                    <div className="mb-1 font-medium text-black">총 시간(분)</div>
                    <div className="mb-2">
                      <input
                        type="number"
                        value={editData?.totalMinutes ?? 0}
                        min={1}
                        onChange={e => handleEditChange('totalMinutes', Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded text-black"
                        placeholder="총 분"
                      />
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-black mb-1">작업 목록</div>
                      {editData?.tasks?.map((task, idx) => (
                        <div key={task.id} className="flex gap-2 items-center mb-1">
                          <input
                            type="text"
                            value={task.name}
                            onChange={e => handleEditTaskChange(idx, 'name', e.target.value)}
                            className="px-2 py-1 border rounded text-black"
                            placeholder="작업명"
                          />
                          <input
                            type="number"
                            value={task.minutes ?? 0}
                            min={0}
                            onChange={e => handleEditTaskChange(idx, 'minutes', Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded text-black"
                            placeholder="분"
                          />
                          <input
                            type="color"
                            value={task.color}
                            onChange={e => handleEditTaskChange(idx, 'color', e.target.value)}
                            className="w-8 h-8 border-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleEditSave} className="flex-1 bg-blue-500 text-white py-1 rounded hover:bg-blue-600">저장</button>
                      <button onClick={handleEditCancel} className="flex-1 bg-gray-300 text-black py-1 rounded hover:bg-gray-400">취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-black">{set.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShare(set)}
                          className="text-green-500 hover:text-green-700 text-sm"
                          title="공유 링크 복사"
                        >
                          공유
                        </button>
                        <button
                          onClick={() => handleEdit(set)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteSet(set.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-black mb-3">
                      {set.endTime && (
                        <div>종료시간: {formatTime(set.endTime)}</div>
                      )}
                      <div>총 시간: {formatDuration(set.totalMinutes)}</div>
                      <div>작업 수: {set.tasks.length}개</div>
                      <div>저장일시: {set.createdAt ? new Date(set.createdAt).toLocaleString() : ''}</div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {set.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.color }}
                          />
                          <span className="text-black">{task.name}</span>
                        </div>
                      ))}
                      {set.tasks.length > 3 && (
                        <span className="text-xs text-black">
                          +{set.tasks.length - 3}개 더
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        onLoadSet(set);
                        setIsVisible(false);
                      }}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      이 세트로 시작하기
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 