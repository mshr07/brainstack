package com.example.banking.reporting.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "incident_records")
public class IncidentRecordEntity {
    @Id
    private String id;
    private String title;
    private String severity;
    private String status;
    private Instant createdAt;

    protected IncidentRecordEntity() {
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getSeverity() { return severity; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
