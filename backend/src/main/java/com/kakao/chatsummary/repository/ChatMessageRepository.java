package com.kakao.chatsummary.repository;

import com.kakao.chatsummary.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionId(Long sessionId);

    List<ChatMessage> findBySessionIdAndMessageTimeBetween(Long sessionId, LocalDateTime startTime, LocalDateTime endTime);

    List<ChatMessage> findBySenderName(String senderName);

    List<ChatMessage> findByMessageTypeAndSessionId(String messageType, Long sessionId);

    @Query(value = """
            SELECT * FROM chat_messages
            WHERE session_id = :sessionId
              AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:queryVector AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<ChatMessage> findSimilarMessages(
            @Param("sessionId") Long sessionId,
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );
}
