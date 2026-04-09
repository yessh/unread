package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FullAnalysisRequest {

    @JsonProperty("session_id")
    private Long sessionId;

    @JsonProperty("messages")
    private List<ParsedMessageDto> messages;

    @JsonProperty("start_time")
    private OffsetDateTime startTime;

    @JsonProperty("end_time")
    private OffsetDateTime endTime;

    @JsonProperty("keywords")
    private List<String> keywords;

    public LocalDateTime getStartTimeAsLocal() {
        return startTime != null ? startTime.toLocalDateTime() : null;
    }

    public LocalDateTime getEndTimeAsLocal() {
        return endTime != null ? endTime.toLocalDateTime() : null;
    }
}
