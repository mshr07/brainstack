package com.example.banking.oms.api;

import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.oms.domain.OrderEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(String id, String rfqId, String quoteId, String clientId, String instrumentId,
                            Side side, BigDecimal notional, String currency, OrderStatus status,
                            String idempotencyKey, Instant createdAt, Instant updatedAt, long version) {
    public static OrderResponse from(OrderEntity order) {
        return new OrderResponse(order.getId(), order.getRfqId(), order.getQuoteId(), order.getClientId(),
                order.getInstrumentId(), order.getSide(), order.getNotional(), order.getCurrency(), order.getStatus(),
                order.getIdempotencyKey(), order.getCreatedAt(), order.getUpdatedAt(), order.getVersion());
    }
}
