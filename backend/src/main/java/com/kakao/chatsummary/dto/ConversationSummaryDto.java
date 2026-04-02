package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationSummaryDto {

    @JsonProperty("period")
    private String period;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("main_topics")
    private List<String> mainTopics;

    @JsonProperty("message_count")
    private Integer messageCount;

    @JsonProperty("participant_count")
    private Integer participantCount;
}
