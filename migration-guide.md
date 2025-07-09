# LastTimer iOS 앱 출시 가이드

## 1. React Native 프로젝트 설정

### 1.1 프로젝트 생성
```bash
npx react-native@latest init LastTimerApp --template react-native-template-typescript
cd LastTimerApp
```

### 1.2 필수 의존성 설치
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm install @react-native-async-storage/async-storage
npm install react-native-background-timer
npm install react-native-push-notification
npm install @react-native-community/datetimepicker
npm install react-native-svg
npm install react-native-reanimated
```

## 2. 컴포넌트 마이그레이션

### 2.1 타이머 컴포넌트 변환
```typescript
// 기존 React 컴포넌트를 React Native로 변환
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimerProps {
  totalTime: number;
  currentTime: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const Timer: React.FC<TimerProps> = ({
  totalTime,
  currentTime,
  isRunning,
  onStart,
  onPause,
  onReset
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>
        {formatTime(currentTime)}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={isRunning ? onPause : onStart}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '일시정지' : '시작'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>리셋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## 3. Firebase 설정

### 3.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. iOS 앱 추가
3. `GoogleService-Info.plist` 다운로드

### 3.2 인증 시스템 구현
```typescript
// src/services/auth.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async signUp(email: string, password: string) {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async signOut() {
    try {
      await auth().signOut();
    } catch (error) {
      throw error;
    }
  }

  static getCurrentUser() {
    return auth().currentUser;
  }
}
```

### 3.3 데이터 동기화 서비스
```typescript
// src/services/dataSync.ts
import firestore from '@react-native-firebase/firestore';
import { AuthService } from './auth';

export class DataSyncService {
  static async saveTimerSet(timerSet: TimerSet) {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('사용자가 로그인되지 않았습니다.');

    const userDoc = firestore().collection('users').doc(user.uid);
    const timerSetsRef = userDoc.collection('timerSets');

    await timerSetsRef.add({
      ...timerSet,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  static async getTimerSets(): Promise<TimerSet[]> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('사용자가 로그인되지 않았습니다.');

    const userDoc = firestore().collection('users').doc(user.uid);
    const timerSetsRef = userDoc.collection('timerSets');
    
    const snapshot = await timerSetsRef.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimerSet[];
  }
}
```

## 4. iOS 앱스토어 출시 준비

### 4.1 Apple Developer Program 가입
1. [Apple Developer](https://developer.apple.com/)에서 계정 생성
2. $99/년 멤버십 가입
3. App Store Connect 설정

### 4.2 앱 아이콘 및 스플래시 스크린
```bash
# react-native-bootsplash 설치
npm install react-native-bootsplash
```

### 4.3 앱스토어 메타데이터
- 앱 이름: "LastTimer - 시간분배 타이머"
- 카테고리: 생산성
- 연령 등급: 4+
- 키워드: 타이머, 시간관리, 집중, 생산성

### 4.4 개인정보처리방침 필수 항목
- 수집하는 개인정보 (이메일, 사용 통계)
- 수집 목적 (서비스 제공, 개선)
- 보관 기간
- 사용자 권리 (삭제, 수정)
- 문의처

## 5. 개발 일정

### Phase 1 (2-3주): 기본 마이그레이션
- React Native 프로젝트 설정
- 핵심 컴포넌트 마이그레이션
- 기본 타이머 기능 구현

### Phase 2 (2-3주): 계정관리
- Firebase 설정
- 인증 시스템 구현
- 데이터 동기화

### Phase 3 (1-2주): iOS 최적화
- iOS 네이티브 기능 통합
- 앱스토어 준비
- 테스트 및 버그 수정

### Phase 4 (1주): 출시
- 앱스토어 제출
- 심사 대응
- 출시 후 모니터링

## 6. 예상 비용

### 개발 비용
- Apple Developer Program: $99/년
- Firebase (Blaze 플랜): 사용량에 따라 $0-50/월
- 개발 도구: 무료

### 운영 비용
- 서버 호스팅: Firebase 무료 티어로 시작
- 앱스토어 수수료: 매출의 30% (Apple)
- 마케팅: 선택사항

## 7. 수익화 전략

### 무료 모델
- 기본 기능 무료 제공
- 프리미엄 기능 유료화
- 광고 수익

### 프리미엄 기능
- 무제한 타이머 세트 저장
- 고급 통계 및 분석
- 테마 및 커스터마이징
- 클라우드 백업

이 가이드를 따라하면 6-8주 내에 iOS 앱 출시가 가능합니다. 