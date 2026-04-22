package com.kakao.chatsummary.controller;

import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.service.EmbeddingService;
import com.kakao.chatsummary.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/vector")
@RequiredArgsConstructor
public class VectorSearchController {

    private final EmbeddingService embeddingService;
    private final GeminiAiService geminiAiService;

    // 세션 메시지 전체 임베딩 (버튼 클릭 시 1회 호출, 비동기)
    @PostMapping("/embed/{sessionId}")
    public ResponseEntity<String> embedSession(@PathVariable Long sessionId) {
        var executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> embeddingService.embedSessionMessages(sessionId));
        executor.shutdown();
        return ResponseEntity.ok("임베딩 시작됨");
    }

    // 임베딩 진행 상태 조회
    @GetMapping("/embed-status/{sessionId}")
    public ResponseEntity<EmbeddingService.EmbeddingProgress> getEmbedStatus(@PathVariable Long sessionId) {
        return ResponseEntity.ok(embeddingService.getProgress(sessionId));
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

    // RAG: 유사 메시지 검색 후 LLM이 답변 생성
    @GetMapping("/rag-search")
    public ResponseEntity<Map<String, Object>> ragSearch(
            @RequestParam Long sessionId,
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit
    ) {
        EmbeddingService.EmbeddingProgress progress = embeddingService.getProgress(sessionId);
        if (progress.status() != EmbeddingService.EmbeddingStatus.DONE) {
            return ResponseEntity.badRequest().body(Map.of("error", "임베딩이 완료되지 않았습니다. 먼저 인덱스를 생성해주세요."));
        }

        List<ChatMessage> retrieved = embeddingService.searchSimilarMessages(sessionId, query, limit);
        String answer = geminiAiService.answerWithContext(query, retrieved);
        return ResponseEntity.ok(Map.of(
                "answer", answer,
                "retrievedCount", retrieved.size(),
                "sources", retrieved
        ));
    }
}
