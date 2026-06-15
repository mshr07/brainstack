package com.example.banking.risk.api;

import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.risk.domain.RiskDecisionEntity;
import java.time.Instant;
import java.util.List;

public record RiskDecisionResponse(String id, RiskDecisionStatus status, List<String> reasons, Instant decidedAt) {
    public static RiskDecisionResponse from(RiskDecisionEntity entity) {
        List<String> reasons = entity.getReasons() == null || entity.getReasons().isBlank()
                ? List.of()
                : List.of(entity.getReasons().split("; "));
        return new RiskDecisionResponse(entity.getId(), entity.getStatus(), reasons, entity.getDecidedAt());
    }
}
