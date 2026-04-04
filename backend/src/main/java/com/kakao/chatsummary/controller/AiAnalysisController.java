package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.dto.*;
import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
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
        List<ChatMessage> messages;
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            messages = request.getMessages().stream()
                    .map(m -> ChatMessage.builder()
                            .senderName(m.getSender())
                            .messageContent(m.getContent())
                            .messageTime(LocalDateTime.now())
                            .build())
                    .collect(Collectors.toList());
        } else {
            messages = messageRepository.findBySessionId(request.getSessionId());
        }
        ConversationSummaryDto result = aiService.summarizeConversation(
                messages,
                request.getStartTime(),
                request.getEndTime());
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
