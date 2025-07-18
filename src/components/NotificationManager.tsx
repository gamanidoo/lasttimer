import { useEffect, useState } from 'react';

interface NotificationManagerProps {
  onPermissionChange: (hasPermission: boolean) => void;
}

export const NotificationManager = ({ onPermissionChange }: NotificationManagerProps) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isClient, setIsClient] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(true); // 팝업 표시 여부를 별도로 관리

  useEffect(() => {
    // 클라이언트 사이드 확인
    setIsClient(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('현재 알림 권한 상태:', currentPermission);
      setPermission(currentPermission);
      onPermissionChange(currentPermission === 'granted');
      
      // 이미 권한이 허용되어 있으면 팝업 숨김
      if (currentPermission === 'granted') {
        setIsPopupVisible(false);
      }
    } else {
      console.log('브라우저가 Notification API를 지원하지 않습니다.');
      setIsPopupVisible(false); // 지원하지 않는 브라우저에서는 팝업 숨김
    }
  }, [onPermissionChange]);

  const requestPermission = async () => {
    if (isRequesting) return; // 중복 요청 방지
    
    setIsRequesting(true);
    console.log('알림 권한을 요청합니다...');
    
    try {
      // 먼저 브라우저 지원 여부 확인
      if (!('Notification' in window)) {
        console.error('이 브라우저는 알림을 지원하지 않습니다.');
        alert('이 브라우저는 알림을 지원하지 않습니다.\n\n💡 권장 브라우저:\nChrome, Firefox, Safari, Edge');
        return;
      }

      // 이미 권한이 있는 경우
      if (Notification.permission === 'granted') {
        console.log('이미 알림 권한이 허용되어 있습니다.');
        setPermission('granted');
        setIsPopupVisible(false); // 팝업 숨김
        onPermissionChange(true);
        return;
      }

      // 권한이 거부된 경우
      if (Notification.permission === 'denied') {
        console.log('알림 권한이 거부되어 있습니다. 브라우저 설정에서 직접 허용해주세요.');
        alert('알림이 차단되어 있습니다.\n\n🔧 해결 방법:\n1. 주소창 왼쪽의 🔒 또는 ℹ️ 아이콘 클릭\n2. "알림" 설정을 "허용"으로 변경\n3. 페이지 새로고침');
        return;
      }

      // 권한 요청
      const result = await Notification.requestPermission();
      console.log('알림 권한 요청 결과:', result);
      
      setPermission(result);
      onPermissionChange(result === 'granted');

      if (result === 'granted') {
        console.log('알림 권한이 허용되었습니다.');
        setIsPopupVisible(false); // 팝업 숨김
        // 테스트 알림 발송
        new Notification('알림이 활성화되었습니다!', {
          body: '이제 작업 전환 시 알림을 받을 수 있습니다.',
          icon: '/favicon.ico'
        });
      } else if (result === 'denied') {
        console.log('사용자가 알림을 거부했습니다.');
        alert('알림이 거부되었습니다.\n\n🔧 나중에 허용하려면:\n주소창 왼쪽 아이콘 → 알림 허용');
      } else {
        console.log('알림 권한 요청이 무시되었습니다.');
      }
    } catch (error) {
      console.error('알림 권한 요청 중 오류 발생:', error);
      alert('알림 설정 중 오류가 발생했습니다.\n\n🔄 해결 방법:\n페이지를 새로고침하고 다시 시도해주세요.');
    } finally {
      setIsRequesting(false);
    }
  };

  const dismissNotification = () => {
    console.log('알림 설정 팝업을 닫습니다.');
    setIsPopupVisible(false); // 팝업 숨김
  };

  // SSR 시에는 렌더링하지 않음
  if (!isClient || typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  // 이미 권한이 허용되었거나 팝업을 닫았으면 숨김
  if (permission === 'granted' || !isPopupVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-black font-medium text-sm">🔔 알림 설정</h3>
        <button
          onClick={dismissNotification}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="닫기"
        >
          ×
        </button>
      </div>
      <p className="mb-3 text-black text-sm leading-relaxed">
        작업 전환 시 알림을 받으시겠습니까?<br />
        <span className="text-gray-600 text-xs">집중에 도움이 됩니다.</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          disabled={isRequesting}
          className={`
            flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
            ${isRequesting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
        >
          {isRequesting ? '요청 중...' : '알림 허용'}
        </button>
        <button
          onClick={dismissNotification}
          className="px-3 py-2 rounded text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          나중에
        </button>
      </div>
    </div>
  );
};
