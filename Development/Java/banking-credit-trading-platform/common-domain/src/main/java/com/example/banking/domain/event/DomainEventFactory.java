package com.example.banking.domain.event;

import com.example.banking.domain.model.Side;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class DomainEventFactory {
    private DomainEventFactory() {
    }

    public static RfqCreatedEvent rfqCreated(String rfqId, String correlationId, String clientId,
                                             String instrumentId, Side side, BigDecimal notional) {
        return new RfqCreatedEvent(newEventId(), rfqId, correlationId, Instant.now(), clientId, instrumentId, side, notional);
    }

    public static RfqQuotedEvent rfqQuoted(String rfqId, String correlationId, String traderId,
                                           BigDecimal quotePrice, BigDecimal spreadBps) {
        return new RfqQuotedEvent(newEventId(), rfqId, correlationId, Instant.now(), traderId, quotePrice, spreadBps);
    }

    public static RfqAcceptedEvent rfqAccepted(String rfqId, String correlationId, String quoteId, String clientId) {
        return new RfqAcceptedEvent(newEventId(), rfqId, correlationId, Instant.now(), quoteId, clientId);
    }

    public static OrderCreatedEvent orderCreated(String orderId, String correlationId, String rfqId,
                                                 String clientId, String instrumentId, Side side, BigDecimal notional) {
        return new OrderCreatedEvent(newEventId(), orderId, correlationId, Instant.now(), rfqId, clientId, instrumentId, side, notional);
    }

    public static OrderExecutedEvent orderExecuted(String orderId, String correlationId, String executionId,
                                                   BigDecimal price, BigDecimal quantity) {
        return new OrderExecutedEvent(newEventId(), orderId, correlationId, Instant.now(), executionId, price, quantity);
    }

    public static RiskRejectedEvent riskRejected(String orderId, String correlationId, String clientId, String reason) {
        return new RiskRejectedEvent(newEventId(), orderId, correlationId, Instant.now(), clientId, reason);
    }

    private static String newEventId() {
        return UUID.randomUUID().toString();
    }
}
