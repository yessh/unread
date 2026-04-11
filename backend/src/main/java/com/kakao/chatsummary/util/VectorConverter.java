package com.kakao.chatsummary.util;

import com.pgvector.PGvector;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class VectorConverter implements AttributeConverter<float[], Object> {

    @Override
    public Object convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) return null;
        return new PGvector(attribute);
    }

    @Override
    public float[] convertToEntityAttribute(Object dbData) {
        if (dbData == null) return null;
        if (dbData instanceof PGvector pv) {
            return pv.toArray();
        }
        if (dbData instanceof String s) {
            return parseVectorString(s);
        }
        return null;
    }

    private float[] parseVectorString(String s) {
        // "[0.1,0.2,...]" 형식 파싱
        String trimmed = s.trim().replaceAll("[\\[\\]]", "");
        String[] parts = trimmed.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }
}
