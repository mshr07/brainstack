package com.example.banking.rfq.domain;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.domain.model.Side;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "rfqs")
public class RfqEntity {
    @Id
    private String id;
    private String clientId;
    private String instrumentId;
    @Enumerated(EnumType.STRING)
    private Side side;
    private BigDecimal notional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private RfqStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    protected RfqEntity() {
    }

    public RfqEntity(String id, String clientId, String instrumentId, Side side, BigDecimal notional, String currency) {
        this.id = id;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.side = side;
        this.notional = notional;
        this.currency = currency;
        this.status = RfqStatus.CREATED;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void markQuoted() { this.status = RfqStatus.QUOTED; this.updatedAt = Instant.now(); }
    public void accept() { this.status = RfqStatus.ACCEPTED; this.updatedAt = Instant.now(); }
    public void reject() { this.status = RfqStatus.REJECTED; this.updatedAt = Instant.now(); }
    public void updateStatus(RfqStatus status) { this.status = status; this.updatedAt = Instant.now(); }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public Side getSide() { return side; }
    public BigDecimal getNotional() { return notional; }
    public String getCurrency() { return currency; }
    public RfqStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
