#!/bin/bash

# LastTimer React Native 프로젝트 설정 스크립트

echo "🚀 LastTimer React Native 프로젝트 설정을 시작합니다..."

# 1. React Native CLI 설치
echo "📦 React Native CLI 설치 중..."
npm install -g @react-native-community/cli

# 2. 새 React Native 프로젝트 생성
echo "📱 React Native 프로젝트 생성 중..."
npx react-native@latest init LastTimerApp --template react-native-template-typescript

# 3. 프로젝트 디렉토리로 이동
cd LastTimerApp

# 4. 필수 의존성 설치
echo "📚 필수 의존성 설치 중..."

# 네비게이션
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# 로컬 저장소
npm install @react-native-async-storage/async-storage

# 타이머 및 알림
npm install react-native-background-timer
npm install react-native-push-notification

# UI 컴포넌트
npm install react-native-svg
npm install react-native-reanimated
npm install @react-native-community/datetimepicker

# 개발 도구
npm install --save-dev @types/react-native

# 5. iOS 의존성 설치
echo "🍎 iOS 의존성 설치 중..."
cd ios
pod install
cd ..

# 6. 프로젝트 구조 생성
echo "📁 프로젝트 구조 생성 중..."
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p assets/images
mkdir -p assets/icons

# 7. 기본 파일 생성
echo "📝 기본 파일 생성 중..."

# App.tsx 수정
cat > App.tsx << 'EOF'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TimerScreen from './src/screens/TimerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SavedSetsScreen from './src/screens/SavedSetsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
};

export default App;
EOF

# 기본 타입 정의
cat > src/types/index.ts << 'EOF'
export interface Task {
  id: string;
  name: string;
  minutes: number;
  duration: number;
  percentage: number;
  color?: string;
  completed: boolean;
}

export interface TimerSet {
  id: string;
  name: string;
  tasks: Task[];
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
}
EOF

# 기본 서비스 생성
cat > src/services/auth.ts << 'EOF'
import auth from '@react-native-firebase/auth';

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
EOF

# 기본 스크린 생성
cat > src/screens/TimerScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TimerScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LastTimer</Text>
      <Text style={styles.subtitle}>타이머 화면이 여기에 표시됩니다</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default TimerScreen;
EOF

cat > src/screens/SettingsScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>
      <Text style={styles.subtitle}>설정 화면이 여기에 표시됩니다</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default SettingsScreen;
EOF

cat > src/screens/SavedSetsScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SavedSetsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>저장된 세트</Text>
      <Text style={styles.subtitle}>저장된 세트 목록이 여기에 표시됩니다</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default SavedSetsScreen;
EOF

# 8. README 파일 생성
cat > README.md << 'EOF'
# LastTimer iOS App

시간분배 타이머 iOS 애플리케이션

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Xcode 14+
- iOS Simulator
- CocoaPods

### 설치 및 실행

1. 의존성 설치
```bash
npm install
cd ios && pod install && cd ..
```

2. iOS 시뮬레이터에서 실행
```bash
npx react-native run-ios
```

3. 실제 기기에서 실행
```bash
npx react-native run-ios --device
```

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── screens/        # 화면 컴포넌트
├── services/       # API 및 비즈니스 로직
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수
└── hooks/          # 커스텀 훅
```

## 주요 기능

- ⏰ 시간분배 타이머
- 📋 작업 목록 관리
- 💾 세트 저장 및 불러오기
- 🔄 계정 동기화
- 🔔 푸시 알림

## 개발 가이드

### 컴포넌트 추가
1. `src/components/` 디렉토리에 새 컴포넌트 생성
2. TypeScript 타입 정의
3. 스타일링 (StyleSheet 사용)
4. 테스트 작성

### 화면 추가
1. `src/screens/` 디렉토리에 새 화면 생성
2. `App.tsx`에 네비게이션 추가
3. 타입 정의 업데이트

## 배포

### iOS 앱스토어 배포
1. Apple Developer Program 가입
2. 앱 아이콘 및 스플래시 스크린 생성
3. 앱스토어 메타데이터 준비
4. 빌드 및 제출

## 라이선스

MIT License
EOF

echo "✅ React Native 프로젝트 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. cd LastTimerApp"
echo "2. npx react-native run-ios"
echo "3. Firebase 프로젝트 설정"
echo "4. 컴포넌트 마이그레이션 시작"
echo ""
echo "📚 추가 문서:"
echo "- migration-guide.md: 마이그레이션 가이드"
echo "- react-native-migration-plan.md: 상세 계획" 