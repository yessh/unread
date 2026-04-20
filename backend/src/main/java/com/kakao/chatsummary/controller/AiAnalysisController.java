package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.dto.*;
import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.service.EmbeddingService;
import com.kakao.chatsummary.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AiAnalysisController {

    private final GeminiAiService aiService;
    private final ChatMessageRepository messageRepository;
    private final EmbeddingService embeddingService;

    /**
     * 기간 기반 대화 요약
     */
    @PostMapping("/summarize")
    public ResponseEntity<ConversationSummaryDto> summarizeConversation(
            @RequestBody SummarizeRequest request) {
        final Long sessionId = request.getSessionId();
        final LocalDateTime startTime = request.getStartTimeAsLocal();
        final LocalDateTime endTime = request.getEndTimeAsLocal();

        List<ChatMessage> messages = request.getMessages().stream()
                .map(m -> ChatMessage.builder()
                        .sessionId(sessionId)
                        .senderName(m.getSender())
                        .messageContent(m.getContent())
                        .build())
                .collect(Collectors.toList());

        log.info("요약 요청: sessionId={}, 메시지 수={}, 구간={}~{}", sessionId, messages.size(), startTime, endTime);

        // 요약과 동시에 해당 구간 임베딩 비동기 시작
        if (startTime != null && endTime != null) {
            var executor = Executors.newSingleThreadExecutor();
            executor.submit(() -> embeddingService.embedSessionMessagesBetween(sessionId, startTime, endTime));
            executor.shutdown();
        }

        ConversationSummaryDto result = aiService.summarizeConversation(messages, startTime, endTime);
        return ResponseEntity.ok(result);
    }

    /**
     * 키워드 기반 핵심 대화 추출
     */
    @PostMapping("/extract-keywords")
    public ResponseEntity<List<KeywordExtractionDto>> extractKeywords(
            @RequestBody KeywordExtractionRequest request) {
        List<ChatMessage> messages = messageRepository.findBySessionId(request.getSessionId());
        List<KeywordExtractionDto> results = aiService.extractKeywordMessages(
                messages,
                request.getKeywords());
        return ResponseEntity.ok(results);
    }

    /**
     * 전체 분석 (요약 + 키워드)
     */
    @PostMapping("/full-analysis")
    public ResponseEntity<AiAnalysisResponseDto> fullAnalysis(
            @RequestBody FullAnalysisRequest request) {
        List<ChatMessage> messages;
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            messages = request.getMessages().stream()
                    .map(m -> ChatMessage.builder()
                            .sessionId(request.getSessionId())
                            .senderName(m.getSender())
                            .messageContent(m.getContent())
                            .messageTime(OffsetDateTime.parse(m.getTimestamp()).toLocalDateTime())
                            .build())
                    .collect(Collectors.toList());

            // DB에 저장 (중복 방지: 이미 저장된 세션이면 스킵)
            boolean alreadySaved = !messageRepository.findBySessionId(request.getSessionId()).isEmpty();
            if (!alreadySaved) {
                messageRepository.saveAll(messages);
            }
        } else {
            messages = messageRepository.findBySessionId(request.getSessionId());
        }

        // 요약 시간 범위에 해당하는 메시지만 비동기 임베딩
        LocalDateTime startTime = request.getStartTimeAsLocal();
        LocalDateTime endTime = request.getEndTimeAsLocal();
        final Long sessionId = request.getSessionId();
        var executor = Executors.newSingleThreadExecutor();
        if (startTime != null && endTime != null) {
            executor.submit(() -> embeddingService.embedSessionMessagesBetween(sessionId, startTime, endTime));
        } else {
            executor.submit(() -> embeddingService.embedSessionMessages(sessionId));
        }
        executor.shutdown();

        AiAnalysisResponseDto result = aiService.analyzeConversation(
                sessionId,
                null,
                messages,
                startTime,
                endTime,
                request.getKeywords());

        return ResponseEntity.ok(result);
    }
}