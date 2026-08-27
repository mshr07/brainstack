package com.adsage.platform.orchestration;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrchestrationRequest(
        UUID runId,
        UUID conversationId,
        String tenantId,
        String subjectId,
        List<String> capabilities,
        String question,
        String clientTimezone,
        String locale,
        Instant deadlineAt,
        Budgets budgets) {

    public record Budgets(
            int maxSteps,
            int maxRepairs,
            int maxInputTokens,
            int maxOutputTokens,
            int maxToolCalls,
            int maxResultBytes,
            double maxEstimatedCostUsd) {}
}
