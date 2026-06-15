package com.example.banking.oms.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "executions")
public class ExecutionEntity {
    @Id
    private String id;
    private String orderId;
    private BigDecimal executedPrice;
    private BigDecimal executedQuantity;
    private String venue;
    private Instant executedAt;

    protected ExecutionEntity() {
    }

    public ExecutionEntity(String id, String orderId, BigDecimal executedPrice, BigDecimal executedQuantity, String venue) {
        this.id = id;
        this.orderId = orderId;
        this.executedPrice = executedPrice;
        this.executedQuantity = executedQuantity;
        this.venue = venue;
        this.executedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getOrderId() { return orderId; }
    public BigDecimal getExecutedPrice() { return executedPrice; }
    public BigDecimal getExecutedQuantity() { return executedQuantity; }
    public String getVenue() { return venue; }
    public Instant getExecutedAt() { return executedAt; }
}
