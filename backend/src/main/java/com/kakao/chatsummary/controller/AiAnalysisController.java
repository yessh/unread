package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.dto.*;
import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.service.EmbeddingService;
import com.kakao.chatsummary.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
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
     * 참여자 분석
     */
    @PostMapping("/analyze-participants")
    public ResponseEntity<List<ParticipantAnalysisDto>> analyzeParticipants(
            @RequestParam Long sessionId) {
        List<ChatMessage> messages = messageRepository.findBySessionId(sessionId);
        List<ParticipantAnalysisDto> results = aiService.analyzeParticipants(messages);
        return ResponseEntity.ok(results);
    }

    /**
     * 단일 참여자 분석 (온디맨드)
     */
    @PostMapping("/analyze-participant")
    public ResponseEntity<ParticipantAnalysisDto> analyzeParticipant(
            @RequestBody SingleParticipantAnalysisRequest request) {
        ParticipantAnalysisDto result = aiService.analyzeParticipant(
                request.getParticipantName(),
                request.getMessages(),
                request.getTotalMessages());
        return ResponseEntity.ok(result);
    }

    /**
     * 단일 참여자 분석 - SSE 스트리밍
     */
    @PostMapping(value = "/analyze-participant/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyzeParticipantStream(@RequestBody SingleParticipantAnalysisRequest request) {
        SseEmitter emitter = new SseEmitter(60_000L);
        var executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> {
            try {
                aiService.analyzeParticipantStream(
                        request.getParticipantName(),
                        request.getMessages(),
                        request.getTotalMessages()
                ).subscribe(
                        chunk -> {
                            try {
                                emitter.send(SseEmitter.event().name("token").data(chunk));
                            } catch (IOException e) {
                                emitter.completeWithError(e);
                            }
                        },
                        error -> {
                            log.error("Streaming error for participant {}", request.getParticipantName(), error);
                            emitter.completeWithError(error);
                        },
                        () -> {
                            try {
                                emitter.send(SseEmitter.event().name("done").data(""));
                            } catch (IOException e) {
                                log.warn("Failed to send done event", e);
                            }
                            emitter.complete();
                        }
                );
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        executor.shutdown();
        return emitter;
    }

    /**
     * 전체 분석 (요약 + 키워드 + 참여자 분석)
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