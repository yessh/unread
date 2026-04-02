package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeywordExtractionDto {

    @JsonProperty("keyword")
    private String keyword;

    @JsonProperty("core_messages")
    private List<CoreMessageDto> coreMessages;

    @JsonProperty("total_count")
    private Integer totalCount;

    @JsonProperty("relevance_score")
    private Double relevanceScore;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CoreMessageDto {

        @JsonProperty("sender")
        private String sender;

        @JsonProperty("content")
        private String content;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        @JsonProperty("relevance")
        private String relevance;
    }
}
