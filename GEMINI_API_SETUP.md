# Gemini AI 통합 설정 가이드

## 개요

Spring AI를 사용하여 Google Gemini API를 연동한 카카오톡 대화 분석 기능입니다.

**제공 기능:**
1. 기간별 대화 요약
2. 키워드 기반 핵심 대화 추출
3. 참여자별 말투 분석 및 성격 요약
4. 전체 통합 분석

---

## 설정 방법

### 1. Gemini API 키 획득

1. [Google AI Studio](https://aistudio.google.com/)에 접속
2. API 키 생성
3. 환경변수 설정:
   ```bash
   export GEMINI_API_KEY=your-gemini-api-key
   ```

### 2. application.yml 설정

```yaml
spring:
  ai:
    google:
      gemini:
        api-key: ${GEMINI_API_KEY}
        project-id: ${GEMINI_PROJECT_ID}
        model: gemini-2.0-flash
```

---

## API 엔드포인트

### 1. 기간별 대화 요약

**요청:**
```http
POST /api/analysis/summarize
Content-Type: application/json

{
  "session_id": 1,
  "start_time": "2025-12-26T00:00:00",
  "end_time": "2025-12-27T23:59:59"
}
```

**응답:**
```json
{
  "period": "2025-12-26T00:00:00 ~ 2025-12-27T23:59:59",
  "summary": "친구들과 저녁 약속 시간을 정하는 대화...",
  "main_topics": [
    "약속 시간 조정",
    "인원 확인",
    "장소 선정"
  ],
  "message_count": 15,
  "participant_count": 4
}
```

---

### 2. 키워드 기반 핵심 대화 추출

**요청:**
```http
POST /api/analysis/extract-keywords
Content-Type: application/json

{
  "session_id": 1,
  "keywords": ["약속", "면접", "시험"]
}
```

**응답:**
```json
[
  {
    "keyword": "약속",
    "core_messages": [
      {
        "sender": "User1",
        "content": "10시반이나 11시 55 구합니다",
        "relevance": "약속 시간 결정의 핵심 메시지"
      },
      {
        "sender": "User2",
        "content": "3명만",
        "relevance": "인원 확인 관련"
      }
    ],
    "total_count": 8,
    "relevance_score": 0.92
  }
]
```

---

### 3. 참여자 말투 분석

**요청:**
```http
POST /api/analysis/analyze-participants?session_id=1
```

**응답:**
```json
[
  {
    "name": "User1",
    "personality_summary": "결정력 있고 주도적인 성향. 명확한 의견 표현",
    "communication_style": "직설적이고 효율적",
    "key_characteristics": [
      "주도성",
      "결정력",
      "명확한 표현"
    ],
    "message_count": 5,
    "message_percentage": 33.33,
    "emoji_usage_frequency": 0,
    "response_tone": "진지함",
    "linguistic_features": {
      "sentence_length": "중간",
      "formality": "존댓말",
      "expression_style": "직설적"
    },
    "confidence_score": 0.87
  }
]
```

---

### 4. 전체 통합 분석

**요청:**
```http
POST /api/analysis/full-analysis
Content-Type: application/json

{
  "session_id": 1,
  "start_time": "2025-12-26T00:00:00",
  "end_time": "2025-12-27T23:59:59",
  "keywords": ["약속", "면접"]
}
```

**응답:**
```json
{
  "session_id": 1,
  "room_name": "친구들",
  "analysis_timestamp": "2025-04-02T12:30:00",
  "conversation_summary": {
    "period": "2025-12-26T00:00:00 ~ 2025-12-27T23:59:59",
    "summary": "...",
    "main_topics": ["약속", "인원 확인"],
    "message_count": 15,
    "participant_count": 4
  },
  "keyword_extractions": [
    {
      "keyword": "약속",
      "core_messages": [...],
      "total_count": 8,
      "relevance_score": 0.92
    }
  ],
  "participant_analyses": [
    {
      "name": "User1",
      "personality_summary": "...",
      "communication_style": "...",
      "key_characteristics": [...],
      ...
    }
  ],
  "overall_insights": "대화 분석 결과:\n- 주요 주제: 약속, 인원 확인\n- 참여 인원: 4명\n- 주요 키워드: 약속, 면접\n",
  "success": true
}
```

---

## 프로젝트 구조

```
backend/
├── src/main/java/com/kakao/chatsummary/
│   ├── config/
│   │   └── AiConfig.java                    # Spring AI 설정
│   ├── controller/
│   │   └── AiAnalysisController.java        # AI 분석 API 엔드포인트
│   ├── service/
│   │   └── GeminiAiService.java             # Gemini API 연동 로직
│   ├── dto/
│   │   ├── ConversationSummaryDto.java      # 요약 응답 DTO
│   │   ├── KeywordExtractionDto.java        # 키워드 추출 응답 DTO
│   │   ├── ParticipantAnalysisDto.java      # 참여자 분석 응답 DTO
│   │   ├── AiAnalysisResponseDto.java       # 통합 응답 DTO
│   │   ├── SummarizeRequest.java            # 요약 요청 DTO
│   │   ├── KeywordExtractionRequest.java    # 키워드 추출 요청 DTO
│   │   └── FullAnalysisRequest.java         # 통합 분석 요청 DTO
│   ├── entity/
│   │   ├── ChatMessage.java                 # 메시지 엔티티
│   │   ├── ChatSession.java                 # 세션 엔티티
│   │   ├── ChatSummary.java                 # 요약 엔티티
│   │   └── User.java                        # 사용자 엔티티
│   └── repository/
│       ├── ChatMessageRepository.java       # 메시지 저장소
│       ├── ChatSessionRepository.java       # 세션 저장소
│       └── UserRepository.java              # 사용자 저장소
└── src/main/resources/
    ├── application.yml                      # Spring Boot 설정
    └── schema.sql                           # DB 스키마
```

---

## 기술 스택

- **Spring Boot**: 3.3.0
- **Spring AI**: 1.0.0 (Gemini 연동)
- **Java**: 17
- **Database**: PostgreSQL
- **Lombok**: 의존성 주입 및 DTO 간소화
- **Hypersistence Utils**: PostgreSQL JSONB 지원

---

## 주의사항

1. **API 키 관리**: 프로덕션 환경에서는 반드시 환경변수로 설정
2. **모델 선택**: `gemini-2.0-flash`는 한국어 지원 및 성능 최적화
3. **응답 포맷**: 모든 응답은 JSON 형식으로 FE에서 처리하기 용이
4. **에러 처리**: API 호출 실패 시 `success: false`와 `error_message` 반환

---

## 다음 단계

1. Frontend API 클라이언트 구현
2. 사용자 인증 (JWT) 통합
3. 파일 업로드 및 파싱 처리
4. 분석 결과 저장 및 조회 기능
