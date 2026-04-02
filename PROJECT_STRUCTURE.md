# 카카오톡 대화 요약 서비스 - 프로젝트 구조

```
unread/
├── backend/                                    # Spring Boot 백엔드 (Gradle)
│   ├── gradle/
│   │   └── wrapper/                           # Gradle Wrapper
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/kakao/chatsummary/
│   │   │   │   ├── config/                    # 설정 클래스 (DB, Security, etc.)
│   │   │   │   ├── controller/                # REST API 컨트롤러
│   │   │   │   ├── service/                   # 비즈니스 로직
│   │   │   │   ├── repository/                # JPA Repository
│   │   │   │   ├── entity/                    # JPA Entity (User, ChatSession, etc.)
│   │   │   │   ├── dto/                       # DTO (Request/Response)
│   │   │   │   ├── exception/                 # Custom Exception
│   │   │   │   └── util/                      # 유틸리티 클래스
│   │   │   └── resources/
│   │   │       ├── schema.sql                 # PostgreSQL 스키마
│   │   │       └── application.yml            # 애플리케이션 설정
│   │   └── test/                              # 테스트 코드
│   ├── build.gradle                           # Gradle 설정
│   ├── settings.gradle                        # Gradle 프로젝트 설정
│   ├── gradlew                                # Gradle Wrapper (Mac/Linux)
│   └── gradlew.bat                            # Gradle Wrapper (Windows)
│
├── frontend/                                   # Next.js 프론트엔드
│   ├── app/                                   # App Router
│   │   ├── dashboard/                         # 대시보드 페이지
│   │   ├── upload/                            # 파일 업로드 페이지
│   │   ├── api/                               # API 라우트
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── common/                            # 공통 컴포넌트
│   │   ├── upload/                            # 업로드 관련 컴포넌트
│   │   └── summary/                           # 요약 관련 컴포넌트
│   ├── lib/                                   # 유틸리티 함수, API 클라이언트
│   ├── styles/                                # CSS/Tailwind 스타일
│   ├── public/                                # 정적 파일
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── PROJECT_STRUCTURE.md                       # 이 파일
```

## 주요 기능별 흐름

### 1. 사용자 인증
- `controller/AuthController` → `service/AuthService` → `repository/UserRepository`

### 2. 파일 업로드
- `controller/ChatSessionController` → `service/ChatSessionService` → `repository/ChatSessionRepository`
- KakaoTalk 텍스트 파싱 로직

### 3. 메시지 저장
- 파싱된 메시지를 `ChatMessage` 엔티티로 변환하여 저장
- `repository/ChatMessageRepository`

### 4. AI 요약
- `service/SummaryService` → AI API 호출 (OpenAI, Gemini 등)
- 요약 결과를 `ChatSummary`에 JSONB로 저장

### 5. 요약 조회
- `controller/SummaryController` → `service/SummaryService` → `repository/ChatSummaryRepository`

## 데이터베이스 스키마 상세

### users
- 기본 사용자 정보 (로그인, 이메일)

### chat_sessions
- 파일 업로드 단위 (방 이름, 파일명, 업로드 시간)
- user_id: 사용자 외래키

### chat_messages
- 파싱된 개별 메시지
- session_id: 채팅 세션 외래키
- sender_name, message_content, message_time

### chat_summaries
- AI 요약 결과
- key_topics (JSONB): 주요 주제
- keywords (JSONB): 핵심 키워드 및 빈도
- participants (JSONB): 참여자 정보
- sentiment_analysis (JSONB): 감정 분석
- custom_data (JSONB): 추가 데이터

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.x
- Spring Data JPA
- PostgreSQL
- Spring Security (JWT)

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Query / SWR (데이터 페칭)

## 다음 단계
1. `build.gradle` 작성 ✓ (Spring Boot 의존성)
2. `application.yml` 작성 (애플리케이션 설정)
3. `package.json` 작성 (Next.js 의존성)
4. Entity 클래스 작성
5. JPA Repository 작성
6. Service 레이어 구현
7. REST Controller 작성
8. Frontend 페이지 구현
