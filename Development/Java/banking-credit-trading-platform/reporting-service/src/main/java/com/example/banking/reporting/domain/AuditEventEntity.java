package com.example.banking.reporting.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEventEntity {
    @Id
    private String id;
    private String aggregateId;
    private String eventType;
    private String actor;
    private String details;
    private Instant occurredAt;

    protected AuditEventEntity() {
    }

    public String getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getActor() { return actor; }
    public String getDetails() { return details; }
    public Instant getOccurredAt() { return occurredAt; }
}
