package com.kakao.chatsummary.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kakao.chatsummary.dto.*;
import com.kakao.chatsummary.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GeminiAiService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiAiService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * 기간 기반 대화 요약
     */
    public ConversationSummaryDto summarizeConversation(List<ChatMessage> messages,
                                                        LocalDateTime startTime,
                                                        LocalDateTime endTime) {
        List<ChatMessage> filteredMessages = (startTime == null || endTime == null)
                ? new ArrayList<>(messages)
                : messages.stream()
                        .filter(m -> m.getMessageTime() == null ||
                                (!m.getMessageTime().isBefore(startTime) &&
                                 !m.getMessageTime().isAfter(endTime)))
                        .collect(Collectors.toList());

        LocalDateTime effectiveStart = startTime != null ? startTime
                : (filteredMessages.isEmpty() ? LocalDateTime.now() : filteredMessages.get(0).getMessageTime());
        LocalDateTime effectiveEnd = endTime != null ? endTime
                : (filteredMessages.isEmpty() ? LocalDateTime.now() : filteredMessages.get(filteredMessages.size() - 1).getMessageTime());

        if (filteredMessages.isEmpty()) {
            return ConversationSummaryDto.builder()
                    .period(effectiveStart + " ~ " + effectiveEnd)
                    .summary("해당 기간에 메시지가 없습니다.")
                    .mainTopics(Collections.emptyList())
                    .messageCount(0)
                    .participantCount(0)
                    .build();
        }

        String conversationText = formatMessagesForAi(filteredMessages);
        String prompt = String.format("""
                다음은 카카오톡 대화 기록입니다. 기간: %s ~ %s

                대화 내용:
                %s

                이 대화의 주제 흐름을 트리/그래프 구조로 분석해주세요.

                규칙:
                - 대화가 순차적으로 한 주제에서 다음으로 이어지면 선형 연결 (child_ids에 다음 노드 1개)
                - 여러 주제가 동시에 병행 진행되면 분기 (하나의 노드 child_ids에 여러 노드)
                - 분기된 주제들이 다시 하나로 합쳐지면 merge (여러 parent_ids를 가진 노드)
                - 루트 노드는 parent_ids가 빈 배열 []
                - 노드 개수는 실제 대화에서 식별된 주제 수만큼 생성 (억지로 줄이거나 늘리지 말 것)

                응답 형식 (JSON만, 코드블록 없이):
                {
                  "summary": "전체 대화 한 줄 요약",
                  "nodes": [
                    {
                      "id": "1",
                      "title": "주제 제목 (15자 이내)",
                      "description": "해당 주제의 맥락과 주요 내용 설명 (2~4문장)",
                      "parent_ids": [],
                      "child_ids": ["2"],
                      "schedules": [
                        {
                          "event": "약속/일정명 (15자 이내, 없으면 생략)",
                          "status": "확정 | 미정 | 취소 | 변경 중 하나",
                          "location": "장소 (언급 없으면 null)",
                          "time": "날짜/시각 (언급 없으면 null)",
                          "attendees": ["참석이 언급된 사람 이름 — '○○도 온대', '○○ 데려올게' 등 포함"],
                          "latecomers": ["지각하거나 늦는다고 언급된 사람 이름"],
                          "attendee_evidence": [
                            {
                              "name": "참석자 이름",
                              "messages": [
                                {"sender": "발신자 이름", "content": "이 사람의 참석 여부를 알 수 있는 실제 메시지 내용"}
                              ]
                            }
                          ]
                        }
                      ],
                      "facts": [
                        {
                          "category": "결론/합의/정보/미결 중 하나",
                          "content": "해당 주제에서 확인되거나 정해진 최종 내용을 한 문장으로"
                        }
                      ]
                    }
                  ]
                }
                - schedules: 해당 주제에서 약속·장소·시각이 언급된 경우 포함. 없으면 빈 배열 []
                - schedules[].status: 이 노드에서 해당 약속의 상태 — 확정/미정/취소/변경 중 하나
                - schedules[].attendees: 참석이 언급된 사람 이름 목록. 없으면 빈 배열 []
                - schedules[].latecomers: 이 약속에서 지각·늦음이 언급된 사람. 없으면 빈 배열 []
                - schedules[].attendee_evidence: attendees에 포함된 각 사람별로, 그 사람이 참석한다고 판단한 근거가 된 실제 메시지 1~3개. 없으면 빈 배열 []
                - facts: 해당 주제의 대화 끝에 확인된 사실·합의·결론만 포함. 오가는 말 중 최종적으로 정해지거나 인정된 것만. 없으면 빈 배열 []
                """, effectiveStart.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                   effectiveEnd.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                   conversationText);

        String response = chatClient.prompt(prompt).call().content();
        Map<String, Object> result = parseJsonResponse(response);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawNodes = (List<Map<String, Object>>) result.getOrDefault("nodes", Collections.emptyList());
        List<ConversationSummaryDto.ConversationTreeNodeDto> treeNodes = rawNodes.stream()
                .map(raw -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> rawSchedules = (List<Map<String, Object>>) raw.getOrDefault("schedules", Collections.emptyList());
                    List<ConversationSummaryDto.ScheduleDto> schedules = rawSchedules.stream()
                            .map(s -> {
                                @SuppressWarnings("unchecked")
                                List<String> attendees = (List<String>) s.getOrDefault("attendees", Collections.emptyList());
                                @SuppressWarnings("unchecked")
                                List<String> schedLatecomers = (List<String>) s.getOrDefault("latecomers", Collections.emptyList());
                                @SuppressWarnings("unchecked")
                                List<Map<String, Object>> rawEvidence = (List<Map<String, Object>>) s.getOrDefault("attendee_evidence", Collections.emptyList());
                                List<ConversationSummaryDto.AttendeeEvidenceDto> attendeeEvidence = rawEvidence.stream()
                                        .map(ev -> {
                                            @SuppressWarnings("unchecked")
                                            List<Map<String, String>> rawMsgs = (List<Map<String, String>>) ev.getOrDefault("messages", Collections.emptyList());
                                            List<ConversationSummaryDto.EvidenceMessageDto> evMsgs = rawMsgs.stream()
                                                    .map(m -> ConversationSummaryDto.EvidenceMessageDto.builder()
                                                            .sender((String) m.get("sender"))
                                                            .content((String) m.get("content"))
                                                            .build())
                                                    .collect(Collectors.toList());
                                            return ConversationSummaryDto.AttendeeEvidenceDto.builder()
                                                    .name((String) ev.get("name"))
                                                    .messages(evMsgs)
                                                    .build();
                                        })
                                        .collect(Collectors.toList());
                                return ConversationSummaryDto.ScheduleDto.builder()
                                        .event((String) s.get("event"))
                                        .status((String) s.get("status"))
                                        .location((String) s.get("location"))
                                        .time((String) s.get("time"))
                                        .attendees(attendees)
                                        .latecomers(schedLatecomers)
                                        .attendeeEvidence(attendeeEvidence)
                                        .build();
                            })
                            .collect(Collectors.toList());
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> rawFacts = (List<Map<String, Object>>) raw.getOrDefault("facts", Collections.emptyList());
                    List<ConversationSummaryDto.FactDto> facts = rawFacts.stream()
                            .map(f -> ConversationSummaryDto.FactDto.builder()
                                    .category((String) f.get("category"))
                                    .content((String) f.get("content"))
                                    .build())
                            .collect(Collectors.toList());
                    return ConversationSummaryDto.ConversationTreeNodeDto.builder()
                            .id((String) raw.get("id"))
                            .title((String) raw.getOrDefault("title", ""))
                            .description((String) raw.getOrDefault("description", ""))
                            .parentIds((List<String>) raw.getOrDefault("parent_ids", Collections.emptyList()))
                            .childIds((List<String>) raw.getOrDefault("child_ids", Collections.emptyList()))
                            .schedules(schedules)
                            .facts(facts)
                            .build();
                })
                .collect(Collectors.toList());

        @SuppressWarnings("unchecked")
        List<String> mainTopics = treeNodes.stream()
                .map(ConversationSummaryDto.ConversationTreeNodeDto::getTitle)
                .collect(Collectors.toList());

        List<String> participantNames = filteredMessages.stream()
                .map(ChatMessage::getSenderName)
                .distinct()
                .collect(Collectors.toList());

        return ConversationSummaryDto.builder()
                .period(effectiveStart + " ~ " + effectiveEnd)
                .summary((String) result.getOrDefault("summary", "분석 실패"))
                .mainTopics(mainTopics)
                .treeNodes(treeNodes)
                .messageCount(filteredMessages.size())
                .participantCount(participantNames.size())
                .participants(participantNames)
                .build();
    }

    /**
     * 키워드 기반 핵심 대화 추출
     */
    public List<KeywordExtractionDto> extractKeywordMessages(List<ChatMessage> messages,
                                                             List<String> keywords) {
        List<KeywordExtractionDto> results = new ArrayList<>();

        for (String keyword : keywords) {
            List<ChatMessage> relevantMessages = messages.stream()
                    .filter(m -> m.getMessageContent().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());

            if (relevantMessages.isEmpty()) {
                continue;
            }

            String prompt = String.format("""
                    다음은 '%s' 키워드와 관련된 카카오톡 메시지들입니다.

                    메시지:
                    %s

                    이 대화들에서 '%s'와 관련된 핵심 내용을 3-5개 선택하고, 각 메시지의 관련성을 설명해주세요.

                    응답 형식:
                    {
                      "core_messages": [
                        {
                          "sender": "발신자",
                          "content": "메시지 내용",
                          "relevance": "이 메시지가 왜 중요한지"
                        }
                      ],
                      "relevance_score": 0.95
                    }
                    """, keyword, formatMessagesForAi(relevantMessages), keyword);

            String response = chatClient.prompt(prompt).call().content();
            Map<String, Object> result = parseJsonResponse(response);

            @SuppressWarnings("unchecked")
            List<Map<String, String>> coreMessages = (List<Map<String, String>>) result.get("core_messages");

            List<KeywordExtractionDto.CoreMessageDto> coreMsgDtos = new ArrayList<>();
            if (coreMessages != null) {
                coreMsgDtos = coreMessages.stream()
                        .map(msg -> KeywordExtractionDto.CoreMessageDto.builder()
                                .sender((String) msg.get("sender"))
                                .content((String) msg.get("content"))
                                .relevance((String) msg.get("relevance"))
                                .build())
                        .collect(Collectors.toList());
            }

            results.add(KeywordExtractionDto.builder()
                    .keyword(keyword)
                    .coreMessages(coreMsgDtos)
                    .totalCount(relevantMessages.size())
                    .relevanceScore(((Number) result.getOrDefault("relevance_score", 0.0)).doubleValue())
                    .build());
        }

        return results;
    }

    /**
     * 전체 분석 (요약 + 키워드)
     */
    public AiAnalysisResponseDto analyzeConversation(Long sessionId,
                                                      String roomName,
                                                      List<ChatMessage> messages,
                                                      LocalDateTime startTime,
                                                      LocalDateTime endTime,
                                                      List<String> keywords) {
        try {
            ConversationSummaryDto summary = summarizeConversation(messages, startTime, endTime);
            List<KeywordExtractionDto> keywordExtractions = extractKeywordMessages(messages, keywords);

            String overallInsights = generateOverallInsights(summary, keywordExtractions);

            return AiAnalysisResponseDto.builder()
                    .sessionId(sessionId)
                    .roomName(roomName)
                    .analysisTimestamp(LocalDateTime.now())
                    .conversationSummary(summary)
                    .keywordExtractions(keywordExtractions)
                    .overallInsights(overallInsights)
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Failed to analyze conversation", e);
            return AiAnalysisResponseDto.builder()
                    .sessionId(sessionId)
                    .roomName(roomName)
                    .analysisTimestamp(LocalDateTime.now())
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * 전체 통찰력 생성
     */
    private String generateOverallInsights(ConversationSummaryDto summary,
                                          List<KeywordExtractionDto> keywords) {
        StringBuilder insights = new StringBuilder();

        insights.append("대화 분석 결과:\n");
        insights.append("- 주요 주제: ").append(String.join(", ", summary.getMainTopics())).append("\n");

        if (!keywords.isEmpty()) {
            insights.append("- 주요 키워드: ")
                    .append(keywords.stream()
                            .map(KeywordExtractionDto::getKeyword)
                            .collect(Collectors.joining(", ")))
                    .append("\n");
        }

        return insights.toString();
    }

    /**
     * RAG: 검색된 메시지를 컨텍스트로 사용해 질문에 답변
     */
    public String answerWithContext(String query, List<ChatMessage> retrievedMessages) {
        if (retrievedMessages.isEmpty()) {
            return chatClient.prompt()
                    .user(query)
                    .call()
                    .content();
        }

        String context = retrievedMessages.stream()
                .map(m -> String.format("[%s] %s: %s",
                        m.getMessageTime().format(DateTimeFormatter.ofPattern("MM/dd HH:mm")),
                        m.getSenderName(),
                        m.getMessageContent()))
                .collect(Collectors.joining("\n"));

        String prompt = String.format("""
                아래는 카카오톡 대화에서 질문과 관련된 메시지들입니다.

                === 관련 메시지 ===
                %s

                === 질문 ===
                %s

                위 메시지들을 바탕으로 질문에 답해주세요. 메시지에 없는 내용은 추측하지 마세요.
                """, context, query);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    /**
     * 메시지를 AI 분석용 텍스트로 포맷팅
     */
    private String formatMessagesForAi(List<ChatMessage> messages) {
        return messages.stream()
                .map(m -> String.format("%s: %s",
                        m.getSenderName(),
                        m.getMessageContent()))
                .collect(Collectors.joining("\n"));
    }

    /**
     * JSON 응답 파싱
     */
    private Map<String, Object> parseJsonResponse(String jsonResponse) {
        try {
            String cleanedJson = jsonResponse
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("```", "")
                    .trim();
            return objectMapper.readValue(cleanedJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Failed to parse AI response as JSON: {}", jsonResponse, e);
            return new HashMap<>();
        }
    }
}
