package com.example.banking.observability;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;

public final class StructuredLog {
    private StructuredLog() {
    }

    public static void info(Logger logger, String event, Map<String, ?> fields) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", event);
        payload.putAll(fields);
        logger.info("{}", payload);
    }
}
