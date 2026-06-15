package com.example.banking.marketdata.api;

import com.example.banking.marketdata.domain.MarketDataTickEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record MarketDataResponse(String instrumentId, BigDecimal bid, BigDecimal ask, BigDecimal mid,
                                 BigDecimal yieldPercent, BigDecimal spreadBps, Instant receivedAt) {
    public static MarketDataResponse from(MarketDataTickEntity entity) {
        return new MarketDataResponse(entity.getInstrumentId(), entity.getBid(), entity.getAsk(), entity.getMid(),
                entity.getYieldPercent(), entity.getSpreadBps(), entity.getReceivedAt());
    }
}
