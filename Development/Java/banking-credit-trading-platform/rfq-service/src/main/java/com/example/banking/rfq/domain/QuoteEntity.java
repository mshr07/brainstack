package com.example.banking.rfq.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "quotes")
public class QuoteEntity {
    @Id
    private String id;
    private String rfqId;
    private String traderId;
    private BigDecimal quotePrice;
    private BigDecimal spreadBps;
    private String status;
    private Instant createdAt;

    protected QuoteEntity() {
    }

    public QuoteEntity(String id, String rfqId, String traderId, BigDecimal quotePrice, BigDecimal spreadBps) {
        this.id = id;
        this.rfqId = rfqId;
        this.traderId = traderId;
        this.quotePrice = quotePrice;
        this.spreadBps = spreadBps;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public void accept() { this.status = "ACCEPTED"; }
    public void reject() { this.status = "REJECTED"; }

    public String getId() { return id; }
    public String getRfqId() { return rfqId; }
    public String getTraderId() { return traderId; }
    public BigDecimal getQuotePrice() { return quotePrice; }
    public BigDecimal getSpreadBps() { return spreadBps; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
