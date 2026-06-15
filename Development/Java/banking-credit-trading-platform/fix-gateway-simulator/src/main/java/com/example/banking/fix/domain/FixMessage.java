package com.example.banking.fix.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class FixMessage {
    private final Map<Integer, String> tags;

    public FixMessage(Map<Integer, String> tags) {
        this.tags = new LinkedHashMap<>(tags);
    }

    public Optional<String> value(int tag) {
        return Optional.ofNullable(tags.get(tag));
    }

    public String required(int tag) {
        return value(tag).orElseThrow(() -> new IllegalArgumentException("Missing FIX tag " + tag));
    }

    public String messageType() {
        return required(35);
    }

    public Map<Integer, String> tags() {
        return Map.copyOf(tags);
    }
}
