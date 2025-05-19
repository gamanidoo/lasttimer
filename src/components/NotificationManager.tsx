import { useEffect, useState } from 'react';

interface NotificationManagerProps {
  onPermissionChange: (hasPermission: boolean) => void;
}

export const NotificationManager = ({ onPermissionChange }: NotificationManagerProps) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    setPermission(Notification.permission);
    onPermissionChange(Notification.permission === 'granted');
  }, [onPermissionChange]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange(result === 'granted');
    } catch (error) {
      console.error('알림 권한 요청 중 오류 발생:', error);
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <p className="mb-2">작업 전환 알림을 받으시겠습니까?</p>
      <button
        onClick={requestPermission}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        알림 허용
      </button>
    </div>
  );
}; 