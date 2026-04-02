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
public class AiAnalysisResponseDto {

    @JsonProperty("session_id")
    private Long sessionId;

    @JsonProperty("room_name")
    private String roomName;

    @JsonProperty("analysis_timestamp")
    private LocalDateTime analysisTimestamp;

    @JsonProperty("conversation_summary")
    private ConversationSummaryDto conversationSummary;

    @JsonProperty("keyword_extractions")
    private List<KeywordExtractionDto> keywordExtractions;

    @JsonProperty("participant_analyses")
    private List<ParticipantAnalysisDto> participantAnalyses;

    @JsonProperty("overall_insights")
    private String overallInsights;

    @JsonProperty("success")
    private Boolean success;

    @JsonProperty("error_message")
    private String errorMessage;
}
