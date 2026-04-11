package com.kakao.chatsummary.service;

import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.util.GeminiEmbeddingClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final GeminiEmbeddingClient embeddingClient;
    private final ChatMessageRepository chatMessageRepository;

    public enum EmbeddingStatus { IDLE, IN_PROGRESS, DONE, FAILED }

    public record EmbeddingProgress(EmbeddingStatus status, int total, int done) {
        public int percent() {
            return total == 0 ? 0 : (int) ((done / (double) total) * 100);
        }
    }

    private final Map<Long, EmbeddingProgress> progressMap = new ConcurrentHashMap<>();

    public EmbeddingProgress getProgress(Long sessionId) {
        return progressMap.getOrDefault(sessionId, new EmbeddingProgress(EmbeddingStatus.IDLE, 0, 0));
    }

    public void embedSessionMessages(Long sessionId) {
        List<ChatMessage> messages = chatMessageRepository.findBySessionId(sessionId);
        int total = messages.size();
        log.info("임베딩 시작: sessionId={}, 메시지 수={}", sessionId, total);
        progressMap.put(sessionId, new EmbeddingProgress(EmbeddingStatus.IN_PROGRESS, total, 0));

        int done = 0;
        for (ChatMessage message : messages) {
            try {
                float[] vector = embeddingClient.embed(message.getMessageContent());
                chatMessageRepository.updateEmbedding(message.getId(), toVectorString(vector));
                done++;
                progressMap.put(sessionId, new EmbeddingProgress(EmbeddingStatus.IN_PROGRESS, total, done));
            } catch (Exception e) {
                log.warn("임베딩 실패: messageId={}, error={}", message.getId(), e.getMessage());
            }
        }

        progressMap.put(sessionId, new EmbeddingProgress(EmbeddingStatus.DONE, total, done));
        log.info("임베딩 완료: sessionId={}", sessionId);
    }


    public List<ChatMessage> searchSimilarMessages(Long sessionId, String query, int limit) {
        float[] queryVector = embeddingClient.embed(query);
        String vectorString = toVectorString(queryVector);
        return chatMessageRepository.findSimilarMessages(sessionId, vectorString, limit);
    }

    private String toVectorString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
