# unread - Claude Code 프로젝트 가이드

카카오톡 대화를 업로드하고 AI로 분석하는 풀스택 서비스입니다.

---

## 📋 프로젝트 개요

**프로젝트명**: unread (카카오톡 대화 분석 서비스)

**기술 스택**:
- **Backend**: Spring Boot 3.3, Java 17, Gradle, PostgreSQL, Spring AI (Gemini)
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Recharts
- **AI**: Google Gemini 2.0 Flash (한국어 지원)

**주요 기능**:
1. 카카오톡 .zip (모바일) / .csv (PC) 파일 업로드 및 파싱
2. AI 기반 대화 분석 (요약, 키워드 추출, 참여자 성격 분석)
3. 대시보드 시각화 (차트, 카드, 하이라이트)

---

## 🗂️ 프로젝트 구조

```
unread/
├── backend/                                  # Spring Boot 애플리케이션
│   ├── build.gradle                         # Gradle 설정 (Spring Boot 3.3.0)
│   ├── settings.gradle
│   ├── gradlew / gradlew.bat               # Gradle Wrapper
│   ├── gradle/wrapper/
│   └── src/
│       ├── main/
│       │   ├── java/com/kakao/chatsummary/
│       │   │   ├── config/               # Spring 설정 (AI, Security)
│       │   │   ├── controller/           # REST API 컨트롤러
│       │   │   ├── service/              # 비즈니스 로직 (GeminiAiService)
│       │   │   ├── entity/               # JPA Entity (User, ChatSession, ChatMessage, ChatSummary)
│       │   │   ├── dto/                  # Request/Response DTO
│       │   │   ├── repository/           # JPA Repository
│       │   │   ├── exception/            # Custom Exception
│       │   │   └── util/                 # 유틸리티 (KakaoTalkMessageParser)
│       │   └── resources/
│       │       ├── application.yml        # Spring Boot 설정
│       │       └── schema.sql             # PostgreSQL 스키마
│       └── test/
│
├── frontend/                                # Next.js 애플리케이션
│   ├── package.json                        # npm 의존성
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.ts
│   ├── postcss.config.js
│   ├── .env.local                         # 환경변수
│   ├── app/
│   │   ├── layout.tsx                     # 루트 레이아웃 + AnalysisProvider
│   │   ├── globals.css                    # Tailwind 스타일
│   │   ├── page.tsx                       # / → /upload 리디렉션
│   │   ├── upload/page.tsx                # 파일 업로드 페이지
│   │   └── dashboard/page.tsx             # 분석 결과 대시보드
│   ├── context/
│   │   └── AnalysisContext.tsx            # 전역 상태 (useReducer + sessionStorage)
│   ├── lib/
│   │   ├── types.ts                       # TypeScript 타입 정의
│   │   ├── api.ts                         # 백엔드 API 클라이언트
│   │   ├── parseKakaoTxt.ts               # .zip → .txt 파싱 (jszip)
│   │   ├── parseCsv.ts                    # .csv 파싱 (papaparse)
│   │   └── chartUtils.ts                  # 차트 데이터 변환 유틸
│   ├── components/
│   │   ├── common/                        # Navbar, LoadingSpinner, Badge
│   │   ├── upload/                        # DropZone, FileTypeGuide
│   │   ├── charts/                        # HourlyFrequencyChart, ParticipantShareChart
│   │   ├── keywords/                      # KeywordInput, HighlightedMessage, KeywordResultList
│   │   ├── participants/                  # ParticipantCard, ParticipantCardGrid
│   │   └── dashboard/                     # SummaryCard, InsightBanner
│   └── public/
│
├── PROJECT_STRUCTURE.md                    # 프로젝트 구조 설명
├── GEMINI_API_SETUP.md                    # Gemini API 통합 가이드
└── CLAUDE.md                               # 이 파일
```

---

## ⚙️ 개발 환경 설정

### Backend 환경 설정

**필수 요구사항**:
- JDK 17+
- PostgreSQL 12+
- Gradle 8.5+

**환경변수** (`backend/src/main/resources/application.yml`):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/unread
    username: postgres
    password: password
  ai:
    google:
      gemini:
        api-key: ${GEMINI_API_KEY}
        model: gemini-2.0-flash
```

**실행 방법**:
```bash
cd backend
./gradlew build
./gradlew bootRun
# http://localhost:8080/api 접속 가능
```

---

### Frontend 환경 설정

**필수 요구사항**:
- Node.js 18+
- npm 또는 yarn

**환경변수** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_MOCK_SESSION_ID=1
```

**실행 방법**:
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000 접속
```

---

## 🔌 API 엔드포인트 (백엔드)

### 파일 업로드 (추후 구현)
- `POST /api/chat/upload` - 카카오톡 파일 업로드

### AI 분석 API
- `POST /api/analysis/summarize` - 기간별 요약
- `POST /api/analysis/extract-keywords` - 키워드 추출
- `POST /api/analysis/analyze-participants` - 참여자 분석
- `POST /api/analysis/full-analysis` - 통합 분석 (모두 포함)

**응답 형식**: 모두 JSON (JSONB PostgreSQL 타입 지원)

자세한 내용은 `GEMINI_API_SETUP.md` 참고

---

## 🏗️ 아키텍처 및 데이터 흐름

### 데이터베이스 스키마

```
users (사용자)
  ├── id, username, email, password, created_at

chat_sessions (세션/방)
  ├── id, user_id, room_name, file_name, uploaded_at

chat_messages (개별 메시지)
  ├── id, session_id, sender_name, message_content, message_time, message_type

chat_summaries (AI 분석 결과)
  ├── id, session_id
  ├── summary_text (TEXT)
  ├── key_topics (JSONB)
  ├── keywords (JSONB)
  ├── participants (JSONB)
  ├── sentiment_analysis (JSONB)
```

### 데이터 흐름

```
[Frontend: /upload]
  ↓ 파일 드롭
[parseKakaoTxt / parseCsv] → ParsedMessage[]
  ↓ 백엔드 전송 (추후)
[Backend: POST /api/chat/upload] → session_id
  ↓
[Backend: POST /api/analysis/full-analysis]
  ├─ GeminiAiService.analyzeConversation()
  │   ├─ summarizeConversation() → ConversationSummary
  │   ├─ extractKeywordMessages() → KeywordExtraction[]
  │   └─ analyzeParticipants() → ParticipantAnalysis[]
  ↓
[Frontend: /dashboard] ← AiAnalysisResponse
  ├─ SummaryCard
  ├─ HourlyFrequencyChart (로컬 파싱 데이터)
  ├─ ParticipantShareChart
  ├─ KeywordResultList
  └─ ParticipantCardGrid
```

---

## 📁 중요 파일 설명

### Backend

| 파일 | 역할 |
|-----|------|
| `build.gradle` | Spring Boot 의존성 정의 (Gemini, PostgreSQL JSONB, JWT) |
| `src/main/resources/schema.sql` | DB 초기화 스크립트 |
| `GeminiAiService.java` | Gemini API 호출 & 프롬프트 작성 |
| `KakaoTalkMessageParser.java` | 카카오톡 .txt 정규식 파싱 |
| `AiAnalysisController.java` | REST API 엔드포인트 |

### Frontend

| 파일 | 역할 |
|-----|------|
| `tailwind.config.js` | 다크모드 색상 팔레트 (`#7c6af7` 보라, `#4fc3f7` 하늘) |
| `AnalysisContext.tsx` | 전역 상태 (useReducer) + sessionStorage 영속성 |
| `parseKakaoTxt.ts` | JSZip으로 .zip 내 .txt 추출 |
| `HourlyFrequencyChart.tsx` | Recharts BarChart (시간대별) |
| `ParticipantCard.tsx` | 참여자 성격 분석 카드 UI |

---

## 🎯 주요 컨벤션

### Backend

**패키지 명명**:
```
com.kakao.chatsummary.{config, controller, service, repository, entity, dto, exception, util}
```

**Entity 클래스**:
- Lombok `@Getter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` 사용
- `@Table`, `@Index` 성능 최적화
- JSONB는 `@Type(JsonType.class)` 사용 (hypersistence-utils)

**DTO 명명**:
- Request: `SummarizeRequest`, `KeywordExtractionRequest`
- Response: `ConversationSummaryDto`, `AiAnalysisResponseDto`

**API 에러 처리**:
```java
throw new ApiError(status, message)
// 또는 custom exception
```

### Frontend

**파일 명명**:
- 컴포넌트: `PascalCase.tsx` (예: `DropZone.tsx`)
- 유틸: `camelCase.ts` (예: `chartUtils.ts`)
- 페이지: `page.tsx` (Next.js 규칙)

**컴포넌트 구조**:
```tsx
'use client' // (클라이언트 컴포넌트인 경우)

interface ComponentProps { ... }

export function ComponentName({ prop }: ComponentProps) {
  // 로직
  return <JSX />
}
```

**스타일**:
- Tailwind 클래스 우선 (`clsx` 사용)
- 커스텀 CSS는 `globals.css`에만 추가
- 색상: `text-accent-primary`, `bg-surface-card` 등 CSS 변수 활용

**상태 관리**:
- 전역: Context API + useReducer (sessionStorage 영속성)
- 로컬: useState 및 useMemo
- API 호출: 백엔드와 직접 통신 (React Query 불필요)

---

## 🔐 보안

### Backend

- **JWT**: `jjwt` 라이브러리 (사용자 인증 추후 구현)
- **CORS**: Spring Security 설정 필요 (현재 미구현)
- **DB**: PostgreSQL 최소 권한 원칙

**환경변수**:
- `GEMINI_API_KEY` 반드시 환경변수로 설정
- `.env` 파일 `.gitignore`에 추가

### Frontend

- `.env.local` (민감한 정보 저장 금지)
- `NEXT_PUBLIC_*` 접두사만 클라이언트에 노출
- `sessionStorage` (XSS 위험 주의)

---

## 📊 데이터 분석 플로우

### 1. 파일 파싱

**모바일 (.zip)**:
- JSZip으로 언팩
- KakaoTalk_*.txt 파일 추출
- 정규식으로 날짜/메시지 분리

**PC (.csv)**:
- PapaParse로 CSV 파싱
- 컬럼 자동 감지 (날짜/시간/보낸사람/내용)

### 2. Gemini AI 분석

**프롬프트 구성**:
```
1. 대화 흐름 요약 (1 문단)
2. 주요 주제 추출 (3-5개)
3. 키워드별 핵심 메시지 (관련성 점수)
4. 참여자별 말투 분석 (성격 요약, 특징, 신뢰도)
```

**응답 형식**: JSON (FE에서 처리하기 쉬운 구조)

### 3. 시각화

- **시간대별**: 0~23시 메시지 수 (로컬 집계)
- **참여자**: 메시지 수 & 비율 (백엔드 응답)
- **키워드**: 강조 표시 + 신뢰도 바
- **성격**: 색상 카드 + 특징 태그

---

## 🚀 배포

### Backend (Gradle)

```bash
./gradlew build
java -jar build/libs/unread-*.jar
```

**환경변수 설정** (프로덕션):
```bash
export GEMINI_API_KEY=...
export SPRING_DATASOURCE_URL=...
export SPRING_DATASOURCE_USERNAME=...
export SPRING_DATASOURCE_PASSWORD=...
```

### Frontend (Next.js)

```bash
npm run build
npm start
# 또는 Vercel 배포
```

**환경변수** (.env.production):
```
NEXT_PUBLIC_API_BASE_URL=https://api.unread.com/api
BACKEND_URL=https://backend.unread.com
```

---

## 🛠️ 일반적인 작업

### 새로운 API 엔드포인트 추가

**Backend**:
1. `entity/` 폴더에 Entity 클래스 작성
2. `repository/` 폴더에 JpaRepository 작성
3. `service/` 폴더에 비즈니스 로직 작성
4. `controller/` 폴더에 REST 엔드포인트 작성
5. `dto/` 폴더에 Request/Response DTO 작성

**Frontend**:
1. `lib/types.ts`에 타입 추가
2. `lib/api.ts`에 API 함수 작성
3. 컴포넌트에서 호출

### 차트 추가

**Frontend**:
1. Recharts 컴포넌트 선택
2. `components/charts/` 폴더에 새 파일 작성
3. `'use client'` 선언 (Recharts는 SSR 미지원)
4. 색상은 `tailwind.config.js` 팔레트에서 선택

### 스타일 커스터마이징

- Tailwind 클래스 사용 (우선)
- 커스텀 필요 시 `globals.css` 추가
- CSS 변수: `--color-accent-primary`, `--color-surface-card` 등

---

## ⚠️ 주의사항

### Backend

- **Spring AI 버전**: `1.0.0` 사용 (호환성 주의)
- **PostgreSQL JSONB**: `hypersistence-utils-hibernate-63` 필수
- **Flyway**: 현재 미사용 (schema.sql 수동 실행)

### Frontend

- **Recharts**: `'use client'` 선언 필수 (SSR 미지원)
- **Large Files**: 대용량 파일 파싱 시 Web Worker 고려
- **sessionStorage**: 새로고침 시 복원되지만 탭 닫으면 소실

### 통합

- **CORS**: 로컬 개발에서 `/api` rewrite 사용 (next.config.ts)
- **Mock Session ID**: 파일 업로드 API 미구현 시 환경변수 `NEXT_PUBLIC_MOCK_SESSION_ID=1` 사용
- **API Base URL**: 환경별로 다르게 설정 필요

---

## 📝 문제 해결

### Backend 빌드 실패

```bash
# Gradle 캐시 초기화
./gradlew clean build
```

### Frontend npm 의존성 문제

```bash
rm -rf node_modules package-lock.json
npm install
```

### Gemini API 호출 실패

- `GEMINI_API_KEY` 환경변수 확인
- API 쿼터 및 지역 제한 확인
- 프롬프트 길이 및 모델 호환성 확인

### 차트가 표시되지 않음

- Recharts 컴포넌트에 `'use client'` 선언 있는지 확인
- 데이터 형식 확인 (HourlyChartData, ParticipantChartData)
- 브라우저 콘솔 에러 확인

---

## 📚 참고 문서

- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [Spring AI](https://spring.io/projects/spring-ai)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Google Gemini API](https://ai.google.dev)

---

## 📞 연락처 및 협력

이 프로젝트는 Claude Code로 관리됩니다.
모든 코드 변경 사항은 git을 통해 추적됩니다.

**주요 명령어**:
```bash
# 백엔드 실행
cd backend && ./gradlew bootRun

# 프론트엔드 실행
cd frontend && npm run dev

# 데이터베이스 초기화
# PostgreSQL에서 schema.sql 실행
```

---

**최종 업데이트**: 2026-04-02
