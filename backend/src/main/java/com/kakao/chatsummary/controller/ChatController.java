package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.dto.SaveMessagesRequest;
import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.entity.ChatSession;
import com.kakao.chatsummary.entity.User;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    @PostMapping("/save")
    public ResponseEntity<Map<String, Long>> saveMessages(@RequestBody SaveMessagesRequest request,
                                                          @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // 세션 생성
        ChatSession session = ChatSession.builder()
                .userId(currentUser.getId())
                .roomName(request.getRoomName())
                .fileName(request.getFileName())
                .uploadedAt(LocalDateTime.now())
                .messageCount(request.getMessages().size())
                .build();
        session = sessionRepository.save(session);
        final Long sessionId = session.getId();

        // 메시지 저장
        List<ChatMessage> messages = request.getMessages().stream()
                .map(m -> {
                    LocalDateTime time;
                    try {
                        time = OffsetDateTime.parse(m.getTimestamp()).toLocalDateTime();
                    } catch (Exception e) {
                        time = LocalDateTime.now();
                    }
                    return ChatMessage.builder()
                            .sessionId(sessionId)
                            .senderName(m.getSender())
                            .messageContent(m.getContent())
                            .messageTime(time)
                            .build();
                })
                .toList();
        messageRepository.saveAll(messages);
        log.info("메시지 저장 완료: sessionId={}, count={}", sessionId, messages.size());

        // 10개 초과 시 가장 오래된 세션(들) 삭제
        List<ChatSession> allSessions = sessionRepository.findByUserIdOrderByUploadedAtDesc(currentUser.getId());
        if (allSessions.size() > 10) {
            List<ChatSession> toDelete = allSessions.subList(10, allSessions.size());
            for (ChatSession old : toDelete) {
                messageRepository.deleteAll(messageRepository.findBySessionId(old.getId()));
                sessionRepository.delete(old);
                log.info("오래된 세션 삭제: sessionId={}", old.getId());
            }
        }

        return ResponseEntity.ok(Map.of("session_id", sessionId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getSessions(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ChatSession> sessions = sessionRepository.findByUserIdOrderByUploadedAtDesc(currentUser.getId());
        List<Map<String, Object>> result = sessions.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("roomName", s.getRoomName());
            m.put("fileName", s.getFileName());
            m.put("uploadedAt", s.getUploadedAt());
            m.put("messageCount", s.getMessageCount());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getUserId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        messageRepository.deleteAll(messageRepository.findBySessionId(sessionId));
        sessionRepository.delete(session);
        log.info("세션 삭제: sessionId={}", sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getSessionMessages(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getUserId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<ChatMessage> messages = messageRepository.findBySessionId(sessionId);
        List<Map<String, Object>> result = messages.stream().map(msg -> {
            Map<String, Object> m = new HashMap<>();
            m.put("sender", msg.getSenderName());
            m.put("content", msg.getMessageContent());
            m.put("timestamp", msg.getMessageTime());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }
}
