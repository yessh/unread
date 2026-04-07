package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.dto.*;
import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
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

    /**
     * 기간 기반 대화 요약
     */
    @PostMapping("/summarize")
    public ResponseEntity<ConversationSummaryDto> summarizeConversation(
            @RequestBody SummarizeRequest request) {
        List<ChatMessage> messages = request.getMessages().stream()
                .map(m -> ChatMessage.builder()
                        .senderName(m.getSender())
                        .messageContent(m.getContent())
                        .messageTime(LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());

        ConversationSummaryDto result = aiService.summarizeConversation(messages, null, null);
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
                            .messageTime(LocalDateTime.parse(m.getTimestamp()))
                            .build())
                    .collect(Collectors.toList());
        } else {
            messages = messageRepository.findBySessionId(request.getSessionId());
        }

        AiAnalysisResponseDto result = aiService.analyzeConversation(
                request.getSessionId(),
                null,   
                messages,
                request.getStartTime(),
                request.getEndTime(),
                request.getKeywords());

        return ResponseEntity.ok(result);
    }
}
