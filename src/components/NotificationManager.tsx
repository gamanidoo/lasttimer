import { useEffect, useState } from 'react';

interface NotificationManagerProps {
  onPermissionChange: (hasPermission: boolean) => void;
}

export const NotificationManager = ({ onPermissionChange }: NotificationManagerProps) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드 확인
    setIsClient(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      onPermissionChange(Notification.permission === 'granted');
    }
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

  // SSR 시에는 렌더링하지 않음
  if (!isClient || typeof window === 'undefined' || !('Notification' in window)) {
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
