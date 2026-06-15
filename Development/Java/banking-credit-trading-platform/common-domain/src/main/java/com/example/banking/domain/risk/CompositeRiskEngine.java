package com.example.banking.domain.risk;

import com.example.banking.domain.model.RiskDecisionStatus;
import java.util.ArrayList;
import java.util.List;

public class CompositeRiskEngine {
    private final List<RiskRule> rules;

    public CompositeRiskEngine(List<RiskRule> rules) {
        this.rules = List.copyOf(rules);
    }

    public RiskDecision evaluate(RiskContext context) {
        List<String> reasons = new ArrayList<>();
        for (RiskRule rule : rules) {
            rule.evaluate(context).ifPresent(reasons::add);
        }
        return reasons.isEmpty()
                ? new RiskDecision(RiskDecisionStatus.APPROVED, List.of())
                : new RiskDecision(RiskDecisionStatus.REJECTED, reasons);
    }
}
