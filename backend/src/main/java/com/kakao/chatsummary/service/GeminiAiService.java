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
                        .filter(m -> !m.getMessageTime().isBefore(startTime) &&
                                   !m.getMessageTime().isAfter(endTime))
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

                아래 항목을 JSON 형식으로 분석해주세요:
                1. 전체 대화 흐름 요약 (한 문단)
                2. 주요 주제 (3-5개, 배열)

                응답 형식:
                {
                  "summary": "요약 내용",
                  "main_topics": ["주제1", "주제2", "주제3"]
                }
                """, effectiveStart.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                   effectiveEnd.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                   conversationText);

        String response = chatClient.prompt(prompt).call().content();
        Map<String, Object> result = parseJsonResponse(response);

        return ConversationSummaryDto.builder()
                .period(effectiveStart + " ~ " + effectiveEnd)
                .summary((String) result.getOrDefault("summary", "분석 실패"))
                .mainTopics((List<String>) result.getOrDefault("main_topics", Collections.emptyList()))
                .messageCount(filteredMessages.size())
                .participantCount((int) filteredMessages.stream()
                        .map(ChatMessage::getSenderName)
                        .distinct()
                        .count())
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
     * 참여자별 말투 분석 및 성격 요약
     */
    public List<ParticipantAnalysisDto> analyzeParticipants(List<ChatMessage> messages) {
        Map<String, List<ChatMessage>> messagesByParticipant = messages.stream()
                .filter(m -> !"SYSTEM".equals(m.getMessageType()))
                .collect(Collectors.groupingBy(ChatMessage::getSenderName));

        List<ParticipantAnalysisDto> analyses = new ArrayList<>();

        for (Map.Entry<String, List<ChatMessage>> entry : messagesByParticipant.entrySet()) {
            String participantName = entry.getKey();
            List<ChatMessage> participantMessages = entry.getValue();

            String conversationText = formatMessagesForAi(participantMessages);
            int totalMessages = messages.size();
            int emojiCount = (int) participantMessages.stream()
                    .filter(m -> "EMOJI".equals(m.getMessageType()))
                    .count();

            String prompt = String.format("""
                    다음은 '%s'이(가) 보낸 카카오톡 메시지들입니다.

                    메시지:
                    %s

                    이 사람의 말투, 성격, 특징을 분석해주세요.

                    응답 형식:
                    {
                      "personality_summary": "성격 요약 (1-2문장)",
                      "communication_style": "의사소통 방식",
                      "key_characteristics": ["특징1", "특징2", "특징3"],
                      "response_tone": "응답 톤 (친근함/진지함/유머러스함 등)",
                      "linguistic_features": {
                        "sentence_length": "짧음/중간/김",
                        "formality": "존댓말/반말/자유로움",
                        "expression_style": "감정 표현 방식"
                      },
                      "confidence_score": 0.85
                    }
                    """, participantName, conversationText);

            String response = chatClient.prompt(prompt).call().content();
            Map<String, Object> result = parseJsonResponse(response);

            @SuppressWarnings("unchecked")
            List<String> characteristics = (List<String>) result.getOrDefault("key_characteristics", Collections.emptyList());
            @SuppressWarnings("unchecked")
            Map<String, String> linguisticFeatures = (Map<String, String>) result.getOrDefault("linguistic_features", new HashMap<>());

            analyses.add(ParticipantAnalysisDto.builder()
                    .name(participantName)
                    .personalitySummary((String) result.getOrDefault("personality_summary", ""))
                    .communicationStyle((String) result.getOrDefault("communication_style", ""))
                    .keyCharacteristics(characteristics)
                    .messageCount(participantMessages.size())
                    .messagePercentage((double) participantMessages.size() / totalMessages * 100)
                    .emojiUsageFrequency(emojiCount)
                    .responseTone((String) result.getOrDefault("response_tone", ""))
                    .linguisticFeatures(linguisticFeatures)
                    .confidenceScore(((Number) result.getOrDefault("confidence_score", 0.0)).doubleValue())
                    .build());
        }

        return analyses;
    }

    /**
     * 전체 분석 (요약 + 키워드 + 참여자 분석)
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
            List<ParticipantAnalysisDto> participantAnalyses = analyzeParticipants(messages);

            String overallInsights = generateOverallInsights(summary, keywordExtractions, participantAnalyses);

            return AiAnalysisResponseDto.builder()
                    .sessionId(sessionId)
                    .roomName(roomName)
                    .analysisTimestamp(LocalDateTime.now())
                    .conversationSummary(summary)
                    .keywordExtractions(keywordExtractions)
                    .participantAnalyses(participantAnalyses)
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
                                          List<KeywordExtractionDto> keywords,
                                          List<ParticipantAnalysisDto> participants) {
        StringBuilder insights = new StringBuilder();

        insights.append("대화 분석 결과:\n");
        insights.append("- 주요 주제: ").append(String.join(", ", summary.getMainTopics())).append("\n");
        insights.append("- 참여 인원: ").append(participants.size()).append("명\n");

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
     * 메시지를 AI 분석용 텍스트로 포맷팅
     */
    private String formatMessagesForAi(List<ChatMessage> messages) {
        return messages.stream()
                .map(m -> String.format("[%s] %s: %s",
                        m.getMessageTime().format(DateTimeFormatter.ISO_LOCAL_TIME),
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
