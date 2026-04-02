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
public class KeywordExtractionRequest {

    @JsonProperty("session_id")
    private Long sessionId;

    @JsonProperty("keywords")
    private List<String> keywords;
}
