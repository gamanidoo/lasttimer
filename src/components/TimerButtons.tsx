interface TimerButtonsProps {
  isRunning: boolean;
  canStart: boolean;
  isComplete: boolean;
  onStart: () => void;
  onReset: () => void;
}

export const TimerButtons = ({
  isRunning,
  canStart,
  isComplete,
  onStart,
  onReset
}: TimerButtonsProps) => {
  const handleReset = () => {
    if (isRunning || isComplete) {
      const message = isComplete 
        ? '완료된 타이머를 초기화하시겠습니까?' 
        : '진행 중인 타이머를 초기화하시겠습니까?';
      const confirmed = window.confirm(message);
      if (!confirmed) return;
    }
    onReset();
  };

  return (
    <div className="flex gap-4 p-4">
      {!isRunning && !isComplete && (
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-lg text-white text-lg font-medium transition-colors ${
            canStart ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          시작하기
        </button>
      )}
      {(isRunning || isComplete) && (
        <button
          onClick={handleReset}
          className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          초기화
        </button>
      )}
    </div>
  );
}; 