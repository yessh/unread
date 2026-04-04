package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SingleParticipantAnalysisRequest {

    @JsonProperty("participant_name")
    private String participantName;

    @JsonProperty("messages")
    private List<String> messages; // content only, no timestamps

    @JsonProperty("total_messages")
    private int totalMessages;
}
