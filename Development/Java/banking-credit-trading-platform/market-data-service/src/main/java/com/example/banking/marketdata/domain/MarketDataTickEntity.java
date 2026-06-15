package com.example.banking.marketdata.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "market_data_ticks")
public class MarketDataTickEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String instrumentId;
    private BigDecimal bid;
    private BigDecimal ask;
    private BigDecimal mid;
    private BigDecimal yieldPercent;
    private BigDecimal spreadBps;
    private Instant receivedAt;

    protected MarketDataTickEntity() {
    }

    public MarketDataTickEntity(String instrumentId, BigDecimal bid, BigDecimal ask, BigDecimal yieldPercent,
                                BigDecimal spreadBps, Instant receivedAt) {
        this.instrumentId = instrumentId;
        this.bid = bid;
        this.ask = ask;
        this.mid = bid.add(ask).divide(new BigDecimal("2"));
        this.yieldPercent = yieldPercent;
        this.spreadBps = spreadBps;
        this.receivedAt = receivedAt;
    }

    public Long getId() { return id; }
    public String getInstrumentId() { return instrumentId; }
    public BigDecimal getBid() { return bid; }
    public BigDecimal getAsk() { return ask; }
    public BigDecimal getMid() { return mid; }
    public BigDecimal getYieldPercent() { return yieldPercent; }
    public BigDecimal getSpreadBps() { return spreadBps; }
    public Instant getReceivedAt() { return receivedAt; }
}
