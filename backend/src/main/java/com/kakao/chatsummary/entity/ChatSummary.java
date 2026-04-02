package com.kakao.chatsummary.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "chat_summaries", indexes = {
        @Index(name = "idx_session_id", columnList = "session_id")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true)
    private Long sessionId;

    @Column(name = "summary_text", nullable = false, columnDefinition = "TEXT")
    private String summaryText;

    @Type(JsonType.class)
    @Column(name = "key_topics", columnDefinition = "jsonb")
    private Map<String, Object> keyTopics;

    @Type(JsonType.class)
    @Column(name = "keywords", columnDefinition = "jsonb")
    private Map<String, Object> keywords;

    @Type(JsonType.class)
    @Column(name = "participants", columnDefinition = "jsonb")
    private Map<String, Object> participants;

    @Type(JsonType.class)
    @Column(name = "sentiment_analysis", columnDefinition = "jsonb")
    private Map<String, Object> sentimentAnalysis;

    @Type(JsonType.class)
    @Column(name = "custom_data", columnDefinition = "jsonb")
    private Map<String, Object> customData;

    @Column(name = "summarized_at", nullable = false)
    private LocalDateTime summarizedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
