package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketDataTickEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String instrumentId,
        BigDecimal bid,
        BigDecimal ask,
        BigDecimal mid,
        BigDecimal yield,
        BigDecimal spreadBps) implements DomainEvent {
    @Override
    public String eventType() {
        return "market-data.ticks";
    }
}
