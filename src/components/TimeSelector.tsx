import { useState, useEffect, useCallback } from 'react';
import { format, addHours, addMinutes, setHours, setMinutes, differenceInMinutes } from 'date-fns'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface TimeSelectorProps {
  onTimeSelect: (hours: number, minutes: number) => void;
  initialTime?: { hours: number; minutes: number };
}

export const TimeSelector = ({ onTimeSelect, initialTime }: TimeSelectorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    if (initialTime) {
      return initialTime;
    }
    const defaultTime = addHours(new Date(), 1);
    return {
      hours: defaultTime.getHours(),
      minutes: defaultTime.getMinutes()
    };
  });

  // 총 시간 계산
  const calculateTotalTime = useCallback(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(selectedTime.hours);
    end.setMinutes(selectedTime.minutes);
    
    // 종료 시각이 현재보다 이전이면 다음 날로 설정
    if (end < now) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMinutes = differenceInMinutes(end, now);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return { hours, minutes };
  }, [selectedTime]);

  // 현재 시각 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시간 조정 함수
  const adjustTime = useCallback((hours: number, minutes: number) => {
    let newTime = new Date();
    newTime = setHours(newTime, selectedTime.hours);
    newTime = setMinutes(newTime, selectedTime.minutes);
    
    newTime = addHours(newTime, hours);
    newTime = addMinutes(newTime, minutes);

    // 현재 시간보다 이전이면 다음날로 설정
    if (newTime < currentTime) {
      newTime = addHours(newTime, 24);
    }

    const newSelectedTime = {
      hours: newTime.getHours(),
      minutes: newTime.getMinutes()
    };

    setSelectedTime(newSelectedTime);
  }, [selectedTime, currentTime]);

  const resetTime = useCallback(() => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const newSelectedTime = {
      hours: currentTime.getHours(),
      minutes: currentTime.getMinutes()
    };
    setSelectedTime(newSelectedTime);
  }, [currentTime]);

  // 시간/분 변경 시 onTimeSelect를 즉시 호출
  const handleHourChange = (hours: number) => {
    setSelectedTime(prev => {
      const updated = { hours, minutes: prev.minutes };
      onTimeSelect(updated.hours, updated.minutes);
      return updated;
    });
  };
  const handleMinuteChange = (minutes: number) => {
    setSelectedTime(prev => {
      const updated = { hours: prev.hours, minutes };
      onTimeSelect(updated.hours, updated.minutes);
      return updated;
    });
  };

  const totalTime = calculateTotalTime(); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xl font-medium text-gray-700">종료 시간</span>
        <div className="flex gap-3">
          <select
            value={selectedTime.hours}
            onChange={(e) => handleHourChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}시
              </option>
            ))}
          </select>
          <select
            value={selectedTime.minutes}
            onChange={(e) => handleMinuteChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i * 5}>
                {String(i * 5).padStart(2, '0')}분
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => {
            const defaultTime = addHours(new Date(), 1);
            setSelectedTime({ hours: defaultTime.getHours(), minutes: defaultTime.getMinutes() });
            onTimeSelect(defaultTime.getHours(), defaultTime.getMinutes());
          }}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          초기화
        </button>
        <button
          onClick={() => adjustTime(-1, 0)}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          -1시간
        </button>
        <button
          onClick={() => adjustTime(1, 0)}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          +1시간
        </button>
        <button
          onClick={() => adjustTime(0, -10)}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          -10분
        </button>
        <button
          onClick={() => adjustTime(0, 10)}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          +10분
        </button>
        <button
          onClick={() => adjustTime(0, -1)}
          className="px-4 py-2 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 transition-colors"
        >
          -1분
        </button>
        <button
          onClick={() => adjustTime(0, 1)}
          className="px-4 py-2 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 transition-colors"
        >
          +1분
        </button>
      </div>
    </div>
  );
}; 