package com.example.banking.domain.risk;

import java.util.Optional;

public class InstrumentRestrictionRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.instrumentRestricted() ? Optional.of("Instrument is restricted for this client") : Optional.empty();
    }
}
