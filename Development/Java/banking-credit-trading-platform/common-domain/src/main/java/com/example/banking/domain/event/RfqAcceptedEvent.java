package com.example.banking.domain.event;

import java.time.Instant;

public record RfqAcceptedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String quoteId,
        String clientId) implements DomainEvent {
    @Override
    public String eventType() {
        return "rfq.accepted";
    }
}
