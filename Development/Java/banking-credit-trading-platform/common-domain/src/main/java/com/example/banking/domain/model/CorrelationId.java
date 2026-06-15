package com.example.banking.domain.model;

import java.util.UUID;

public record CorrelationId(String value) {
    public CorrelationId {
        if (value == null || value.isBlank()) {
            value = UUID.randomUUID().toString();
        }
    }

    public static CorrelationId newId() {
        return new CorrelationId(UUID.randomUUID().toString());
    }
}
