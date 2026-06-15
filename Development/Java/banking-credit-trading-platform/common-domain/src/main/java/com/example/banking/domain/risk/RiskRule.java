package com.example.banking.domain.risk;

import java.util.Optional;

public interface RiskRule {
    Optional<String> evaluate(RiskContext context);
}
