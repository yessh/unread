# 카카오톡 대화 요약 서비스 - 프로젝트 구조

```
unread/
├── backend/                                    # Spring Boot 백엔드 (Gradle)
│   ├── gradle/
│   │   └── wrapper/                           # Gradle Wrapper
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/kakao/chatsummary/
│   │   │   │   ├── config/                    # 설정 클래스
│   │   │   │   │   ├── AiConfig.java          # Spring AI / Gemini 설정
│   │   │   │   │   ├── SecurityConfig.java    # Spring Security 설정
│   │   │   │   │   └── WebMvcConfig.java      # CORS / Web MVC 설정
│   │   │   │   ├── controller/
│   │   │   │   │   └── AiAnalysisController.java  # AI 분석 REST API
│   │   │   │   ├── service/
│   │   │   │   │   └── GeminiAiService.java   # Gemini API 연동 로직
│   │   │   │   ├── repository/
│   │   │   │   │   ├── ChatMessageRepository.java
│   │   │   │   │   ├── ChatSessionRepository.java
│   │   │   │   │   └── UserRepository.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── ChatSession.java
│   │   │   │   │   ├── ChatMessage.java
│   │   │   │   │   └── ChatSummary.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── AiAnalysisResponseDto.java
│   │   │   │   │   ├── ConversationSummaryDto.java
│   │   │   │   │   ├── KeywordExtractionDto.java
│   │   │   │   │   ├── ParticipantAnalysisDto.java
│   │   │   │   │   ├── FullAnalysisRequest.java
│   │   │   │   │   ├── KeywordExtractionRequest.java
│   │   │   │   │   └── SummarizeRequest.java
│   │   │   │   ├── exception/                 # Custom Exception
│   │   │   │   └── util/
│   │   │   │       └── KakaoTalkMessageParser.java  # .txt 메시지 파서
│   │   │   └── resources/
│   │   │       ├── schema.sql                 # PostgreSQL 스키마
│   │   │       └── application.yml            # 애플리케이션 설정
│   │   └── test/
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew
│   └── gradlew.bat
│
├── frontend/                                   # Next.js 프론트엔드
│   ├── app/                                   # App Router
│   │   ├── layout.tsx                         # 루트 레이아웃 + AnalysisProvider
│   │   ├── globals.css                        # Tailwind 전역 스타일
│   │   ├── page.tsx                           # / → /upload 리디렉션
│   │   ├── upload/
│   │   │   └── page.tsx                       # 파일 업로드 페이지
│   │   └── dashboard/
│   │       └── page.tsx                       # 분석 결과 대시보드
│   ├── components/
│   │   ├── common/                            # 공통 컴포넌트
│   │   │   ├── Navbar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Badge.tsx
│   │   ├── upload/                            # 업로드 컴포넌트
│   │   │   ├── DropZone.tsx
│   │   │   └── FileTypeGuide.tsx
│   │   ├── dashboard/                         # 대시보드 컴포넌트
│   │   │   ├── SummaryCard.tsx
│   │   │   └── InsightBanner.tsx
│   │   ├── charts/                            # 차트 컴포넌트
│   │   │   ├── HourlyFrequencyChart.tsx
│   │   │   └── ParticipantShareChart.tsx
│   │   ├── keywords/                          # 키워드 컴포넌트
│   │   │   ├── KeywordInput.tsx
│   │   │   ├── KeywordResultList.tsx
│   │   │   └── HighlightedMessage.tsx
│   │   └── participants/                      # 참여자 컴포넌트
│   │       ├── ParticipantCard.tsx
│   │       └── ParticipantCardGrid.tsx
│   ├── context/
│   │   └── AnalysisContext.tsx                # 전역 상태 (useReducer + sessionStorage)
│   ├── lib/
│   │   ├── api.ts                             # 백엔드 API 클라이언트
│   │   ├── types.ts                           # TypeScript 타입 정의
│   │   ├── chartUtils.ts                      # 차트 데이터 변환 유틸
│   │   ├── parseKakaoTxt.ts                   # .zip → .txt 파싱 (JSZip)
│   │   └── parseCsv.ts                        # .csv 파싱 (PapaParse)
│   ├── public/
│   ├── .env.local                             # 환경변수
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.ts
│
└── PROJECT_STRUCTURE.md                       # 이 파일
```

## 주요 기능별 흐름

### 1. 파일 업로드 및 파싱 (Frontend)
- `DropZone` → `parseKakaoTxt.ts` (.zip) / `parseCsv.ts` (.csv) → `ParsedMessage[]`
- 파싱 결과를 `AnalysisContext`에 저장

### 2. AI 분석 요청
- `AnalysisContext.uploadAndAnalyze()` → `lib/api.ts` → `POST /api/analysis/full-analysis`
- `GeminiAiService` → Google Gemini 2.0 Flash API 호출

### 3. 결과 시각화
- `dashboard/page.tsx`에서 Context 구독
- `HourlyFrequencyChart`: 시간대별 메시지 수 (로컬 집계)
- `ParticipantShareChart`: 참여자별 비율 (백엔드 응답)
- `ParticipantCardGrid`: 성격 분석 카드
- `KeywordResultList`: 키워드별 핵심 메시지

### 4. 사용자 인증 (미구현)
- `entity/User.java`, `repository/UserRepository.java` 준비됨
- JWT 통합 예정

## 데이터베이스 스키마

### users
- 기본 사용자 정보 (로그인, 이메일)

### chat_sessions
- 파일 업로드 단위 (방 이름, 파일명, 업로드 시간)
- `user_id`: 사용자 외래키

### chat_messages
- 파싱된 개별 메시지
- `session_id`: 채팅 세션 외래키
- `sender_name`, `message_content`, `message_time`

### chat_summaries
- AI 분석 결과 (JSONB 저장)
- `summary_text` (TEXT)
- `key_topics`, `keywords`, `participants`, `sentiment_analysis` (JSONB)

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.3.0
- Spring AI 1.0.0 (Gemini 연동)
- Spring Data JPA + PostgreSQL
- Spring Security (JWT - 추후)
- Lombok, Hypersistence Utils (JSONB)

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Context API + useReducer (전역 상태)
- Recharts (차트)
- JSZip, PapaParse (파일 파싱)

## 남은 작업
1. 파일 업로드 API 구현 (`POST /api/chat/upload`)
2. JWT 사용자 인증 통합
3. 분석 결과 저장 및 조회 기능
