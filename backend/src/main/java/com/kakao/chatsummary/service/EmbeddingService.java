package com.kakao.chatsummary.service;

import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import com.kakao.chatsummary.util.GeminiEmbeddingClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private static final int BATCH_SIZE = 100;
    private static final int PARALLEL_BATCHES = 5;

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

        // 배치 분할
        List<List<ChatMessage>> batches = partition(messages, BATCH_SIZE);
        AtomicInteger done = new AtomicInteger(0);

        ExecutorService executor = Executors.newFixedThreadPool(PARALLEL_BATCHES);
        List<Future<?>> futures = new ArrayList<>();

        for (List<ChatMessage> batch : batches) {
            futures.add(executor.submit(() -> {
                int saved = processBatch(batch);
                int current = done.addAndGet(saved);
                progressMap.put(sessionId, new EmbeddingProgress(EmbeddingStatus.IN_PROGRESS, total, current));
            }));
        }

        // 모든 배치 완료 대기
        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (Exception e) {
                log.warn("배치 처리 중 예외: {}", e.getMessage());
            }
        }
        executor.shutdown();

        progressMap.put(sessionId, new EmbeddingProgress(EmbeddingStatus.DONE, total, done.get()));
        log.info("임베딩 완료: sessionId={}, 성공={}/{}", sessionId, done.get(), total);
    }

    // 배치 처리: 실패 시 1개씩 fallback
    private int processBatch(List<ChatMessage> batch) {
        try {
            List<String> texts = batch.stream().map(ChatMessage::getMessageContent).toList();
            List<float[]> vectors = embeddingClient.batchEmbed(texts);

            int saved = 0;
            for (int i = 0; i < batch.size(); i++) {
                try {
                    chatMessageRepository.updateEmbedding(batch.get(i).getId(), toVectorString(vectors.get(i)));
                    saved++;
                } catch (Exception e) {
                    log.warn("저장 실패: messageId={}", batch.get(i).getId());
                }
            }
            return saved;

        } catch (Exception e) {
            log.warn("배치 실패, 1개씩 재시도: batchSize={}, error={}", batch.size(), e.getMessage());
            return fallbackIndividual(batch);
        }
    }

    // fallback: 1개씩 처리
    private int fallbackIndividual(List<ChatMessage> batch) {
        int saved = 0;
        for (ChatMessage message : batch) {
            try {
                float[] vector = embeddingClient.embed(message.getMessageContent());
                chatMessageRepository.updateEmbedding(message.getId(), toVectorString(vector));
                saved++;
            } catch (Exception e) {
                log.warn("개별 임베딩 실패: messageId={}", message.getId());
            }
        }
        return saved;
    }

    public List<ChatMessage> searchSimilarMessages(Long sessionId, String query, int limit) {
        float[] queryVector = embeddingClient.embed(query);
        return chatMessageRepository.findSimilarMessages(sessionId, toVectorString(queryVector), limit);
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

    private <T> List<List<T>> partition(List<T> list, int size) {
        List<List<T>> partitions = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            partitions.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return partitions;
    }
}
