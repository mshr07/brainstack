package com.example.banking.rfq.api;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.rfq.domain.RfqEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record RfqResponse(String id, String clientId, String instrumentId, Side side, BigDecimal notional,
                          String currency, RfqStatus status, Instant createdAt, Instant updatedAt) {
    public static RfqResponse from(RfqEntity rfq) {
        return new RfqResponse(rfq.getId(), rfq.getClientId(), rfq.getInstrumentId(), rfq.getSide(),
                rfq.getNotional(), rfq.getCurrency(), rfq.getStatus(), rfq.getCreatedAt(), rfq.getUpdatedAt());
    }
}
