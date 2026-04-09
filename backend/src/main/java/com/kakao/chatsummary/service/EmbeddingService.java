package com.kakao.chatsummary.service;

import com.kakao.chatsummary.entity.ChatMessage;
import com.kakao.chatsummary.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public void embedSessionMessages(Long sessionId) {
        List<ChatMessage> messages = chatMessageRepository.findBySessionId(sessionId);
        log.info("임베딩 시작: sessionId={}, 메시지 수={}", sessionId, messages.size());

        for (ChatMessage message : messages) {
            try {
                float[] vector = embeddingModel.embed(message.getMessageContent());
                message.setEmbedding(vector);
                chatMessageRepository.save(message);
            } catch (Exception e) {
                log.warn("임베딩 실패: messageId={}, error={}", message.getId(), e.getMessage());
            }
        }

        log.info("임베딩 완료: sessionId={}", sessionId);
    }

    public List<ChatMessage> searchSimilarMessages(Long sessionId, String query, int limit) {
        float[] queryVector = embeddingModel.embed(query);
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
