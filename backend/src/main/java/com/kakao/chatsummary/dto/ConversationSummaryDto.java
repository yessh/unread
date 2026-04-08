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

    @JsonProperty("tree_nodes")
    private List<ConversationTreeNodeDto> treeNodes;

    @JsonProperty("message_count")
    private Integer messageCount;

    @JsonProperty("participant_count")
    private Integer participantCount;

    @JsonProperty("participants")
    private List<String> participants;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationTreeNodeDto {

        @JsonProperty("id")
        private String id;

        @JsonProperty("title")
        private String title;

        @JsonProperty("description")
        private String description;

        @JsonProperty("parent_ids")
        private List<String> parentIds;

        @JsonProperty("child_ids")
        private List<String> childIds;

        @JsonProperty("schedules")
        private List<ScheduleDto> schedules;

        @JsonProperty("facts")
        private List<FactDto> facts;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleDto {

        @JsonProperty("event")
        private String event;

        @JsonProperty("location")
        private String location;

        @JsonProperty("time")
        private String time;

        @JsonProperty("attendees")
        private List<String> attendees;

        @JsonProperty("latecomers")
        private List<String> latecomers;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FactDto {

        @JsonProperty("category")
        private String category;

        @JsonProperty("content")
        private String content;
    }
}
