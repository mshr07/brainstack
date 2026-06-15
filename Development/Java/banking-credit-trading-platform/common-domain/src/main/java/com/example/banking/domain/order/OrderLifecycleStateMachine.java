package com.example.banking.domain.order;

import com.example.banking.domain.exception.BusinessRuleViolationException;
import com.example.banking.domain.model.OrderStatus;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;

public class OrderLifecycleStateMachine {
    private static final Map<OrderStatus, EnumSet<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(OrderStatus.NEW, EnumSet.of(OrderStatus.VALIDATED, OrderStatus.CANCELLED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.VALIDATED, EnumSet.of(OrderStatus.ACCEPTED, OrderStatus.RISK_REJECTED, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.ACCEPTED, EnumSet.of(OrderStatus.ROUTED, OrderStatus.CANCELLED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.ROUTED, EnumSet.of(OrderStatus.EXECUTED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.RISK_REJECTED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.EXECUTED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.FAILED, EnumSet.noneOf(OrderStatus.class));
    }

    public OrderStatus transition(OrderStatus current, OrderStatus next) {
        if (!canTransition(current, next)) {
            throw new BusinessRuleViolationException("Invalid order transition from " + current + " to " + next);
        }
        return next;
    }

    public boolean canTransition(OrderStatus current, OrderStatus next) {
        return TRANSITIONS.getOrDefault(current, EnumSet.noneOf(OrderStatus.class)).contains(next);
    }
}
