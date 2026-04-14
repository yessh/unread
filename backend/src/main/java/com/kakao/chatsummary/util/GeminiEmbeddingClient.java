package com.kakao.chatsummary.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiEmbeddingClient {

    private static final String MODEL = "models/gemini-embedding-001";
    private static final String SINGLE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
    private static final String BATCH_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents";

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    // 단일 임베딩
    public float[] embed(String text) {
        var requestBody = Map.of(
                "model", MODEL,
                "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        EmbedResponse response = restClient.post()
                .uri(SINGLE_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(EmbedResponse.class);

        if (response == null || response.embedding() == null) {
            throw new RuntimeException("임베딩 응답이 비어있습니다.");
        }
        return toFloatArray(response.embedding().values());
    }

    // 배치 임베딩 (최대 100개)
    public List<float[]> batchEmbed(List<String> texts) {
        var requests = texts.stream()
                .map(text -> Map.of(
                        "model", MODEL,
                        "content", Map.of("parts", List.of(Map.of("text", text)))
                ))
                .toList();

        var requestBody = Map.of("requests", requests);

        BatchEmbedResponse response = restClient.post()
                .uri(BATCH_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(BatchEmbedResponse.class);

        if (response == null || response.embeddings() == null) {
            throw new RuntimeException("배치 임베딩 응답이 비어있습니다.");
        }

        return response.embeddings().stream()
                .map(e -> toFloatArray(e.values()))
                .toList();
    }

    private float[] toFloatArray(List<Float> values) {
        float[] result = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            result[i] = values.get(i);
        }
        return result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EmbedResponse(Embedding embedding) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BatchEmbedResponse(List<Embedding> embeddings) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Embedding(List<Float> values) {}
}
