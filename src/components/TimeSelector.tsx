import { useState, useEffect, useCallback } from 'react';
import { format, addHours, addMinutes, setHours, setMinutes, differenceInMinutes } from 'date-fns';

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

  const resetTime = useCallback(() => {
    const newSelectedTime = {
      hours: currentTime.getHours(),
      minutes: currentTime.getMinutes()
    };
    setSelectedTime(newSelectedTime);
  }, [currentTime]);

  const handleSave = useCallback(() => {
    onTimeSelect(selectedTime.hours, selectedTime.minutes);
  }, [selectedTime, onTimeSelect]);

  const totalTime = calculateTotalTime();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-black font-medium">
          현재 시각: {format(currentTime, 'HH:mm')}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedTime.hours}
              onChange={(e) => {
                const newHours = parseInt(e.target.value);
                adjustTime(newHours - selectedTime.hours, 0);
              }}
              className="p-2 rounded border border-gray-300 text-black"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-lg text-black font-medium">:</span>
            <select
              value={selectedTime.minutes}
              onChange={(e) => {
                const newMinutes = parseInt(e.target.value);
                adjustTime(0, newMinutes - selectedTime.minutes);
              }}
              className="p-2 rounded border border-gray-300 text-black"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-black font-medium whitespace-nowrap">
            (총 {totalTime.hours > 0 ? `${totalTime.hours}시간 ` : ''}{totalTime.minutes}분)
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={resetTime}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          초기화
        </button>
        <button
          onClick={() => adjustTime(-1, 0)}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          -1시간
        </button>
        <button
          onClick={() => adjustTime(1, 0)}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          +1시간
        </button>
        <button
          onClick={() => adjustTime(0, -10)}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          -10분
        </button>
        <button
          onClick={() => adjustTime(0, 10)}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          +10분
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSave}
          className="w-full max-w-md px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
        >
          저장
        </button>
      </div>
    </div>
  );
}; 