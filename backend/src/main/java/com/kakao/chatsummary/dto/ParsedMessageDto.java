package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedMessageDto {

    @JsonProperty("sender")
    private String sender;

    @JsonProperty("content")
    private String content;

    @JsonProperty("timestamp")
    private String timestamp; // "yyyy-MM-ddTHH:mm:ss" 형식
}
