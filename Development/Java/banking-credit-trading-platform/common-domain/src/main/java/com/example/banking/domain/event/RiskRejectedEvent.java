package com.example.banking.domain.event;

import java.time.Instant;

public record RiskRejectedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String clientId,
        String reason) implements DomainEvent {
    @Override
    public String eventType() {
        return "risk.rejected";
    }
}
