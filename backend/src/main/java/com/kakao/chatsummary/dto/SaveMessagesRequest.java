package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SaveMessagesRequest {

    @JsonProperty("room_name")
    private String roomName;

    @JsonProperty("file_name")
    private String fileName;

    @JsonProperty("messages")
    private List<ParsedMessageDto> messages;
}
