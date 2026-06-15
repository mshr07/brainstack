package com.example.banking.domain.risk;

import java.util.Optional;

public class DuplicateOrderRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.duplicateOrder() ? Optional.of("Duplicate idempotency key detected") : Optional.empty();
    }
}
