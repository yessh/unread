package com.kakao.chatsummary.entity;

import com.kakao.chatsummary.util.VectorConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_session_id", columnList = "session_id"),
        @Index(name = "idx_message_time", columnList = "message_time"),
        @Index(name = "idx_sender_name", columnList = "sender_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "sender_name", nullable = false, length = 255)
    private String senderName;

    @Column(name = "message_content", nullable = false, columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "message_time", nullable = false)
    private LocalDateTime messageTime;

    @Column(name = "message_type", length = 50)
    @Builder.Default
    private String messageType = "TEXT";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "embedding", columnDefinition = "vector(768)", insertable = false, updatable = false)
    @Convert(converter = VectorConverter.class)
    private float[] embedding;
}
