package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.service.EmbeddingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vector")
@RequiredArgsConstructor
public class VectorSearchController {

    private final EmbeddingService embeddingService;

    // 세션 메시지 전체 임베딩 (업로드 후 1회 호출)
    @PostMapping("/embed/{sessionId}")
    public ResponseEntity<String> embedSession(@PathVariable Long sessionId) {
        embeddingService.embedSessionMessages(sessionId);
        return ResponseEntity.ok("임베딩 완료");
    }

    // 자연어로 유사 메시지 검색
    @GetMapping("/search")
    public ResponseEntity<List<ChatMessage>> search(
            @RequestParam Long sessionId,
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit
    ) {
        List<ChatMessage> results = embeddingService.searchSimilarMessages(sessionId, query, limit);
        return ResponseEntity.ok(results);
    }
}
