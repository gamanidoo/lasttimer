interface TimerHeaderProps {
  endTime: { hours: number; minutes: number } | null;
  taskCount: number;
  isRunning: boolean;
  isComplete: boolean;
  totalMinutes: number;
  onTaskClick: () => void;
  onReset: () => void;
  onTaskCountChange: (type: 'add' | 'remove') => void;
  startTime?: Date | null;
  actualEndTime?: Date | null; // 실제 종료 시간 추가
}

export const TimerHeader = ({
  endTime,
  taskCount,
  isRunning,
  isComplete,
  totalMinutes,
  onTaskClick,
  onReset,
  onTaskCountChange,
  startTime,
  actualEndTime
}: TimerHeaderProps) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
  };

  const formatTime = (time: Date | { hours: number; minutes: number }) => {
    const hours = 'getHours' in time ? time.getHours() : time.hours;
    const minutes = 'getMinutes' in time ? time.getMinutes() : time.minutes;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // 실제 경과 시간 계산 (startTime과 actualEndTime 사용)
  const getActualDurationText = () => {
    if (startTime && actualEndTime) {
      const diffMs = actualEndTime.getTime() - startTime.getTime();
      const diffMinutes = Math.round(diffMs / 60000); // 분 단위로 반올림
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
      if (hours > 0) return `${hours}시간`;
      return `${minutes}분`;
    }
    return '';
  };



  if (isComplete) {
    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">수고하셨습니다! 🎉</h2>
        {startTime && actualEndTime && (
          <div className="text-lg mb-4">
            <div>{formatTime(startTime)}~{formatTime(actualEndTime)}</div>
            <div className="font-bold">{getActualDurationText()} 집중 완료!</div>
          </div>
        )}
        <button
          onClick={onReset}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          새로운 타이머 시작하기
        </button>
      </div>
    );
  }

  if (isRunning && endTime && startTime) {
    const durationStr = formatDuration(totalMinutes);
    const timeRangeStr = `${formatTime(startTime)}~${formatTime(endTime)}`;

    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl">
          <span className="font-bold">{timeRangeStr}</span>
          <br />
          <span className="font-bold">{durationStr}</span> 집중해요
        </h2>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-6">
        {!isRunning && !isComplete && (
          <>
            <button
              onClick={() => onTaskCountChange('remove')}
              disabled={taskCount <= 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors ${
                taskCount <= 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              title="작업 제거"
            >
              -
            </button>
            <button
              onClick={onTaskClick}
              className="text-2xl font-bold underline decoration-dotted underline-offset-4 hover:text-blue-600 px-4"
            >
              {taskCount}개 작업 집중
            </button>
            <button
              onClick={() => onTaskCountChange('add')}
              className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white text-lg font-bold transition-colors"
              title="작업 추가"
            >
              +
            </button>
          </>
        )}
        {isRunning && !isComplete && (
          <button
            onClick={onTaskClick}
            className="text-2xl font-bold underline decoration-dotted underline-offset-4 hover:text-blue-600"
          >
            {taskCount}개 작업 집중
          </button>
        )}
      </div>
    </div>
  );
}; 