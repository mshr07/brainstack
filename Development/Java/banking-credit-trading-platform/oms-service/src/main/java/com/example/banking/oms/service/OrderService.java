package com.example.banking.oms.service;

import com.example.banking.domain.event.DomainEventFactory;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.domain.order.OrderLifecycleStateMachine;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.DuplicateOrderRule;
import com.example.banking.domain.risk.InstrumentRestrictionRule;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import com.example.banking.oms.api.OrderRequests.CreateOrder;
import com.example.banking.oms.domain.ExecutionEntity;
import com.example.banking.oms.domain.OrderEntity;
import com.example.banking.oms.repository.ExecutionRepository;
import com.example.banking.oms.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final ExecutionRepository executions;
    private final OrderEventPublisher publisher;
    private final OrderLifecycleStateMachine lifecycle = new OrderLifecycleStateMachine();
    private final CompositeRiskEngine riskEngine = new CompositeRiskEngine(List.of(
            new KillSwitchRule(), new InstrumentRestrictionRule(), new DuplicateOrderRule(), new MaxOrderNotionalRule()));

    public OrderService(OrderRepository orders, ExecutionRepository executions, OrderEventPublisher publisher) {
        this.orders = orders;
        this.executions = executions;
        this.publisher = publisher;
    }

    @Transactional
    public OrderEntity create(CreateOrder request, String correlationId) {
        var existing = orders.findByIdempotencyKey(request.idempotencyKey());
        if (existing.isPresent()) {
            return existing.get();
        }

        String orderId = "order-" + UUID.randomUUID();
        OrderEntity order = orders.save(new OrderEntity(orderId, request.rfqId(), request.quoteId(), request.clientId(),
                request.instrumentId(), request.side(), request.notional(), request.currency(), request.idempotencyKey()));
        publisher.publish(DomainEventFactory.orderCreated(orderId, correlationId, request.rfqId(), request.clientId(),
                request.instrumentId(), request.side(), request.notional()));

        order.status(lifecycle.transition(order.getStatus(), OrderStatus.VALIDATED));
        var decision = riskEngine.evaluate(new RiskContext(request.clientId(), request.instrumentId(),
                new Money(request.notional(), request.currency()), Money.usd("0"), Money.usd("5000000"),
                false, false, false));
        if (decision.status() == RiskDecisionStatus.REJECTED) {
            order.status(lifecycle.transition(order.getStatus(), OrderStatus.RISK_REJECTED));
            publisher.publish(DomainEventFactory.riskRejected(orderId, correlationId, request.clientId(), String.join("; ", decision.reasons())));
            return order;
        }

        order.status(lifecycle.transition(order.getStatus(), OrderStatus.ACCEPTED));
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.ROUTED));
        ExecutionEntity execution = executions.save(new ExecutionEntity("exec-" + UUID.randomUUID(), orderId,
                new BigDecimal("99.875"), request.notional(), "SIMULATED_FIX_GATEWAY"));
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.EXECUTED));
        publisher.publish(DomainEventFactory.orderExecuted(orderId, correlationId, execution.getId(),
                execution.getExecutedPrice(), execution.getExecutedQuantity()));
        return order;
    }

    @Transactional
    public OrderEntity cancel(String orderId) {
        OrderEntity order = get(orderId);
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.CANCELLED));
        return order;
    }

    @Transactional(readOnly = true)
    public OrderEntity get(String orderId) {
        return orders.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }
}
