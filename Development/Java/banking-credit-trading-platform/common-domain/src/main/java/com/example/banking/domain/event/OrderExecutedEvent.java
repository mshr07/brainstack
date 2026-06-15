package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderExecutedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String executionId,
        BigDecimal executedPrice,
        BigDecimal executedQuantity) implements DomainEvent {
    @Override
    public String eventType() {
        return "order.executed";
    }
}
