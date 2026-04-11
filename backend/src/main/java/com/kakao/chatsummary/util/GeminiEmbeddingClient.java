package com.kakao.chatsummary.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiEmbeddingClient {

    private static final String EMBEDDING_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public float[] embed(String text) {
        var requestBody = Map.of(
                "model", "models/gemini-embedding-001",
                "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        EmbedResponse response = restClient.post()
                .uri(EMBEDDING_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(EmbedResponse.class);

        if (response == null || response.embedding() == null) {
            throw new RuntimeException("임베딩 응답이 비어있습니다.");
        }

        List<Float> values = response.embedding().values();
        float[] result = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            result[i] = values.get(i);
        }
        return result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EmbedResponse(Embedding embedding) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Embedding(List<Float> values) {}
}
