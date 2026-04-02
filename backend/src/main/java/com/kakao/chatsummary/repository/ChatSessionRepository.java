package com.kakao.chatsummary.repository;

import com.kakao.chatsummary.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserId(Long userId);

    List<ChatSession> findByUserIdOrderByUploadedAtDesc(Long userId);
}
