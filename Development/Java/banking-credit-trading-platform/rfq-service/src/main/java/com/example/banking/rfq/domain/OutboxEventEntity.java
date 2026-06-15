package com.example.banking.rfq.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outbox_events")
public class OutboxEventEntity {
    @Id
    private String id;
    private String aggregateId;
    private String topic;
    private String payload;
    private Instant createdAt;
    private Instant publishedAt;

    protected OutboxEventEntity() {
    }

    public OutboxEventEntity(String id, String aggregateId, String topic, String payload) {
        this.id = id;
        this.aggregateId = aggregateId;
        this.topic = topic;
        this.payload = payload;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getTopic() { return topic; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPublishedAt() { return publishedAt; }
}
