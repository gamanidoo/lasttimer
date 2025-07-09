# LastTimer React Native 마이그레이션 계획

## 현재 프로젝트 분석

### 주요 컴포넌트
1. **CircleTimer.tsx** - 원형 타이머 (가장 복잡)
2. **TaskList.tsx** - 작업 목록
3. **SavedSets.tsx** - 저장된 세트 관리
4. **TimeSelector.tsx** - 시간 선택기
5. **TimerHeader.tsx** - 타이머 헤더
6. **TimerButtons.tsx** - 타이머 버튼
7. **TaskForm.tsx** - 작업 폼
8. **SaveSetForm.tsx** - 세트 저장 폼
9. **NotificationManager.tsx** - 알림 관리

## 마이그레이션 우선순위

### Phase 1: 핵심 기능 (2주)
1. **TimerButtons.tsx** - 가장 단순한 컴포넌트부터 시작
2. **TaskForm.tsx** - 기본 폼 컴포넌트
3. **TimerHeader.tsx** - 헤더 컴포넌트
4. **TaskList.tsx** - 리스트 컴포넌트

### Phase 2: 복잡한 기능 (3주)
1. **TimeSelector.tsx** - 시간 선택 로직
2. **SaveSetForm.tsx** - 저장 폼
3. **SavedSets.tsx** - 세트 관리
4. **CircleTimer.tsx** - 가장 복잡한 컴포넌트

### Phase 3: 고급 기능 (1주)
1. **NotificationManager.tsx** - 알림 시스템
2. 백그라운드 타이머
3. 로컬 저장소

## 컴포넌트별 마이그레이션 가이드

### 1. TimerButtons.tsx 마이그레이션

**현재 코드:**
```typescript
// 웹 버전
<button onClick={onStart}>시작</button>
```

**React Native 버전:**
```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const TimerButtons: React.FC<TimerButtonsProps> = ({ onStart, onPause, onReset, isRunning }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={isRunning ? onPause : onStart}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '일시정지' : '시작'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={onReset}
      >
        <Text style={styles.buttonText}>리셋</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 2. CircleTimer.tsx 마이그레이션

**주요 변경사항:**
1. SVG → React Native SVG
2. HTML 이벤트 → React Native 터치 이벤트
3. CSS 스타일 → StyleSheet
4. 백그라운드 타이머 → react-native-background-timer

**원형 그래프 구현:**
```typescript
import Svg, { Circle, G } from 'react-native-svg';

const CircleTimer: React.FC<CircleTimerProps> = ({ tasks, isRunning, totalMinutes }) => {
  const size = 300;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const renderTaskArcs = () => {
    return tasks.map((task, index) => {
      const startAngle = getStartAngle(index);
      const endAngle = getEndAngle(index);
      
      return (
        <Circle
          key={task.id}
          cx={center}
          cy={center}
          r={radius}
          stroke={task.color || '#007AFF'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={getStrokeDashoffset(startAngle, endAngle)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {renderTaskArcs()}
        </G>
      </Svg>
      
      <View style={styles.centerContent}>
        <Text style={styles.timeText}>{formatTime(elapsedMinutes)}</Text>
        <Text style={styles.totalTimeText}>총 {formatTime(totalMinutes)}</Text>
      </View>
    </View>
  );
};
```

### 3. 알림 시스템 마이그레이션

**웹 알림 → 푸시 알림:**
```typescript
import PushNotification from 'react-native-push-notification';

export class NotificationService {
  static init() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  static scheduleTimerEnd(minutes: number) {
    PushNotification.localNotificationSchedule({
      message: '타이머가 완료되었습니다!',
      date: new Date(Date.now() + minutes * 60 * 1000),
      allowWhileIdle: true,
      channelId: 'timer',
    });
  }

  static cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }
}
```

## 데이터 관리 마이그레이션

### 1. 로컬 저장소
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export class LocalStorage {
  static async saveTimerSets(sets: TimerSet[]) {
    try {
      await AsyncStorage.setItem('timerSets', JSON.stringify(sets));
    } catch (error) {
      console.error('저장 실패:', error);
    }
  }

  static async getTimerSets(): Promise<TimerSet[]> {
    try {
      const data = await AsyncStorage.getItem('timerSets');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('불러오기 실패:', error);
      return [];
    }
  }
}
```

### 2. Firebase 동기화
```typescript
import firestore from '@react-native-firebase/firestore';

export class CloudSync {
  static async syncToCloud(userId: string, timerSets: TimerSet[]) {
    const userDoc = firestore().collection('users').doc(userId);
    const timerSetsRef = userDoc.collection('timerSets');
    
    // 기존 데이터 삭제
    const snapshot = await timerSetsRef.get();
    const batch = firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 새 데이터 추가
    timerSets.forEach(set => {
      const docRef = timerSetsRef.doc();
      batch.set(docRef, {
        ...set,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
  }

  static async syncFromCloud(userId: string): Promise<TimerSet[]> {
    const userDoc = firestore().collection('users').doc(userId);
    const timerSetsRef = userDoc.collection('timerSets');
    
    const snapshot = await timerSetsRef.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimerSet[];
  }
}
```

## 네비게이션 설정

### React Navigation 설정
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Timer" 
          component={TimerScreen}
          options={{ title: 'LastTimer' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: '설정' }}
        />
        <Stack.Screen 
          name="SavedSets" 
          component={SavedSetsScreen}
          options={{ title: '저장된 세트' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

## 개발 환경 설정

### 1. React Native CLI 설치
```bash
npm install -g @react-native-community/cli
```

### 2. iOS 개발 환경
```bash
# Xcode 설치 (Mac App Store)
# iOS Simulator 설치
# CocoaPods 설치
sudo gem install cocoapods
```

### 3. 프로젝트 생성
```bash
npx react-native@latest init LastTimerApp --template react-native-template-typescript
cd LastTimerApp
```

### 4. 의존성 설치
```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm install @react-native-async-storage/async-storage
npm install react-native-background-timer
npm install react-native-push-notification
npm install react-native-svg
npm install react-native-reanimated
npm install @react-native-community/datetimepicker
```

## 테스트 전략

### 1. 단위 테스트
```typescript
import { render, fireEvent } from '@testing-library/react-native';

test('타이머 시작 버튼 클릭', () => {
  const onStart = jest.fn();
  const { getByText } = render(<TimerButtons onStart={onStart} />);
  
  fireEvent.press(getByText('시작'));
  expect(onStart).toHaveBeenCalled();
});
```

### 2. 통합 테스트
- 타이머 시작/정지/리셋
- 작업 추가/삭제/수정
- 세트 저장/불러오기
- 계정 로그인/로그아웃

### 3. 성능 테스트
- 메모리 사용량
- 배터리 소모
- 백그라운드 동작

## 배포 준비

### 1. iOS 빌드 설정
```bash
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

### 2. 앱 아이콘 생성
```bash
npm install -g @bam.tech/react-native-make
react-native set-icon --path ./assets/icon.png --platform ios
```

### 3. 스플래시 스크린 설정
```bash
npm install react-native-bootsplash
npx react-native generate-bootsplash ./assets/bootsplash.png
```

이 계획을 따라하면 6-8주 내에 iOS 앱 출시가 가능합니다. 