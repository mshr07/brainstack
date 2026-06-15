package com.example.banking.domain.event;

import com.example.banking.domain.model.Side;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderCreatedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String rfqId,
        String clientId,
        String instrumentId,
        Side side,
        BigDecimal notional) implements DomainEvent {
    @Override
    public String eventType() {
        return "order.created";
    }
}
