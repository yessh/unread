package com.kakao.chatsummary.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantAnalysisDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("personality_summary")
    private String personalitySummary;

    @JsonProperty("communication_style")
    private String communicationStyle;

    @JsonProperty("key_characteristics")
    private List<String> keyCharacteristics;

    @JsonProperty("message_count")
    private Integer messageCount;

    @JsonProperty("message_percentage")
    private Double messagePercentage;

    @JsonProperty("emoji_usage_frequency")
    private Integer emojiUsageFrequency;

    @JsonProperty("response_tone")
    private String responseTone;

    @JsonProperty("linguistic_features")
    private Map<String, String> linguisticFeatures;

    @JsonProperty("confidence_score")
    private Double confidenceScore;
}
