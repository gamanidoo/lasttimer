interface TimerHeaderProps {
  endTime: { hours: number; minutes: number } | null;
  taskCount: number;
  isRunning: boolean;
  isComplete: boolean;
  totalMinutes: number;
  onTimeClick: (e: React.MouseEvent) => void;
  onTaskClick: () => void;
  onReset: () => void;
  onTaskCountChange: (type: 'add' | 'remove') => void;
  startTime?: Date | null;
}

export const TimerHeader = ({
  endTime,
  taskCount,
  isRunning,
  isComplete,
  totalMinutes,
  onTimeClick,
  onTaskClick,
  onReset,
  onTaskCountChange,
  startTime
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

  if (isComplete) {
    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">수고하셨습니다! 🎉</h2>
        {startTime && endTime && (
          <div className="text-lg mb-4">
            <div>{formatTime(startTime)}~{formatTime(endTime)}</div>
            <div className="font-bold">{formatDuration(totalMinutes)} 집중 완료!</div>
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