package com.example.banking.risk.domain;

import com.example.banking.domain.model.RiskDecisionStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "risk_decisions")
public class RiskDecisionEntity {
    @Id
    private String id;
    private String clientId;
    private String instrumentId;
    private BigDecimal orderNotional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private RiskDecisionStatus status;
    private String reasons;
    private Instant decidedAt;

    protected RiskDecisionEntity() {
    }

    public RiskDecisionEntity(String id, String clientId, String instrumentId, BigDecimal orderNotional,
                              String currency, RiskDecisionStatus status, String reasons) {
        this.id = id;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.orderNotional = orderNotional;
        this.currency = currency;
        this.status = status;
        this.reasons = reasons;
        this.decidedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public BigDecimal getOrderNotional() { return orderNotional; }
    public String getCurrency() { return currency; }
    public RiskDecisionStatus getStatus() { return status; }
    public String getReasons() { return reasons; }
    public Instant getDecidedAt() { return decidedAt; }
}
