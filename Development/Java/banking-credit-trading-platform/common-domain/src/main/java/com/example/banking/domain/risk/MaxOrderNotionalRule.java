package com.example.banking.domain.risk;

import java.util.Optional;

public class MaxOrderNotionalRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        if (context.orderNotional().compareTo(context.clientDailyLimit()) > 0) {
            return Optional.of("Order notional exceeds client limit");
        }
        if (context.clientDailyExposure().add(context.orderNotional()).compareTo(context.clientDailyLimit()) > 0) {
            return Optional.of("Daily exposure limit would be breached");
        }
        return Optional.empty();
    }
}
