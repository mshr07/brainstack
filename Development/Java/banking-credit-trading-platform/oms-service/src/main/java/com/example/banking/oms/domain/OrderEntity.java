package com.example.banking.oms.domain;

import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.Side;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    private String id;
    private String rfqId;
    private String quoteId;
    private String clientId;
    private String instrumentId;
    @Enumerated(EnumType.STRING)
    private Side side;
    private BigDecimal notional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private String idempotencyKey;
    private Instant createdAt;
    private Instant updatedAt;
    @Version
    private long version;

    protected OrderEntity() {
    }

    public OrderEntity(String id, String rfqId, String quoteId, String clientId, String instrumentId, Side side,
                       BigDecimal notional, String currency, String idempotencyKey) {
        this.id = id;
        this.rfqId = rfqId;
        this.quoteId = quoteId;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.side = side;
        this.notional = notional;
        this.currency = currency;
        this.idempotencyKey = idempotencyKey;
        this.status = OrderStatus.NEW;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void status(OrderStatus status) { this.status = status; this.updatedAt = Instant.now(); }

    public String getId() { return id; }
    public String getRfqId() { return rfqId; }
    public String getQuoteId() { return quoteId; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public Side getSide() { return side; }
    public BigDecimal getNotional() { return notional; }
    public String getCurrency() { return currency; }
    public OrderStatus getStatus() { return status; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
