package com.example.banking.domain.event;

import java.time.Instant;

public interface DomainEvent {
    String eventId();
    String eventType();
    String aggregateId();
    String correlationId();
    Instant occurredAt();
}
