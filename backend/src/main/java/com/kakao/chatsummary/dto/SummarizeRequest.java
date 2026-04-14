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
public class SummarizeRequest {

    @JsonProperty("session_id")
    private Long sessionId;

    @JsonProperty("start_time")
    private String startTime;

    @JsonProperty("end_time")
    private String endTime;

    @JsonProperty("messages")
    private List<ParsedMessageDto> messages;

    public LocalDateTime getStartTimeAsLocal() {
        if (startTime == null || startTime.isBlank()) return null;
        try {
            return OffsetDateTime.parse(startTime).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(startTime);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public LocalDateTime getEndTimeAsLocal() {
        if (endTime == null || endTime.isBlank()) return null;
        try {
            return OffsetDateTime.parse(endTime).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(endTime);
            } catch (Exception ex) {
                return null;
            }
        }
    }
}
