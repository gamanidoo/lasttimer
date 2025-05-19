interface TimerHeaderProps {
  endTime: { hours: number; minutes: number } | null;
  taskCount: number;
  isRunning: boolean;
  isComplete: boolean;
  totalMinutes: number;
  onTimeClick: () => void;
  onTaskClick: () => void;
  onReset: () => void;
}

export const TimerHeader = ({
  endTime,
  taskCount,
  isRunning,
  isComplete,
  totalMinutes,
  onTimeClick,
  onTaskClick,
  onReset
}: TimerHeaderProps) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
  };

  if (isComplete) {
    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">수고하셨습니다! 🎉</h2>
        <button
          onClick={onReset}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          새로운 타이머 시작하기
        </button>
      </div>
    );
  }

  if (isRunning && endTime) {
    const endTimeStr = `${endTime.hours.toString().padStart(2, '0')}:${endTime.minutes.toString().padStart(2, '0')}`;
    const durationStr = formatDuration(totalMinutes);

    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl">
          <span className="font-bold">{endTimeStr}</span>까지
          <br />
          <span className="font-bold">{durationStr}</span> 집중해요
        </h2>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl">
        <button
          onClick={onTimeClick}
          className="font-bold underline decoration-dotted underline-offset-4 hover:text-blue-600"
        >
          {endTime ? formatDuration(totalMinutes) : '시간'}
        </button>
        을
        <br />
        <button
          onClick={onTaskClick}
          className="font-bold underline decoration-dotted underline-offset-4 hover:text-blue-600"
        >
          {taskCount}개
        </button>
        로 나눠서 집중할게요
      </h2>
    </div>
  );
}; 