package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record RfqQuotedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String traderId,
        BigDecimal quotePrice,
        BigDecimal spreadBps) implements DomainEvent {
    @Override
    public String eventType() {
        return "rfq.quoted";
    }
}
