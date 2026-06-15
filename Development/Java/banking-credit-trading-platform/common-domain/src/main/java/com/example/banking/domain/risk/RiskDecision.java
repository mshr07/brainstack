package com.example.banking.domain.risk;

import com.example.banking.domain.model.RiskDecisionStatus;
import java.util.List;

public record RiskDecision(RiskDecisionStatus status, List<String> reasons) {
    public static RiskDecision approved() {
        return new RiskDecision(RiskDecisionStatus.APPROVED, List.of());
    }

    public static RiskDecision rejected(List<String> reasons) {
        return new RiskDecision(RiskDecisionStatus.REJECTED, List.copyOf(reasons));
    }
}
