package com.example.banking.domain.event;

import java.time.Instant;
import java.util.Map;

public record AuditEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String actor,
        String action,
        Map<String, String> details) implements DomainEvent {
    @Override
    public String eventType() {
        return "audit.events";
    }
}
