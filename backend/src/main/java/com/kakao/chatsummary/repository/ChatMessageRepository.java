package com.kakao.chatsummary.repository;

import com.kakao.chatsummary.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionId(Long sessionId);

    List<ChatMessage> findBySessionIdAndMessageTimeBetween(Long sessionId, LocalDateTime startTime, LocalDateTime endTime);

    List<ChatMessage> findBySenderName(String senderName);

    List<ChatMessage> findByMessageTypeAndSessionId(String messageType, Long sessionId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE chat_messages SET embedding = (:vector)::vector WHERE id = :id", nativeQuery = true)
    void updateEmbedding(@Param("id") Long id, @Param("vector") String vector);

    @Query(value = """
            SELECT * FROM chat_messages
            WHERE session_id = :sessionId
              AND embedding IS NOT NULL
              AND (1 - (embedding <=> (:queryVector)::vector)) > 0.3
            ORDER BY
              (1 - (embedding <=> (:queryVector)::vector)) * 0.6 +
              CASE WHEN LOWER(message_content) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 0.4 ELSE 0.0 END
              DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<ChatMessage> findSimilarMessages(
            @Param("sessionId") Long sessionId,
            @Param("queryVector") String queryVector,
            @Param("keyword") String keyword,
            @Param("limit") int limit
    );
}
