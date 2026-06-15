package com.example.banking.domain.risk;

import java.util.Optional;

public class KillSwitchRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.killSwitchEnabled() ? Optional.of("Trading kill switch is enabled") : Optional.empty();
    }
}
