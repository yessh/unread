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

        return ResponseEntity.ok(Map.of("session_id", sessionId));
    }
}
