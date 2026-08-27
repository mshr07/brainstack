package com.adsage.platform.orchestration;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public record OrchestrationResponse(
        UUID runId,
        String requestId,
        String state,
        String intent,
        int stepCount,
        String answer,
        List<Evidence> evidence,
        List<Validation> validations,
        List<String> limitations) {

    private static final Set<String> ALLOWED_STATES =
            Set.of(
                    "completed",
                    "clarification",
                    "unsafe",
                    "approval_required",
                    "failed",
                    "budget_exceeded");
    private static final Set<String> ALLOWED_INTENTS =
            Set.of("documentation", "metadata", "analytical", "clarification", "unsafe");

    public OrchestrationResponse {
        Objects.requireNonNull(runId, "runId");
        Objects.requireNonNull(requestId, "requestId");
        if (!ALLOWED_STATES.contains(state)) {
            throw new IllegalArgumentException("Unknown orchestration state");
        }
        if (!ALLOWED_INTENTS.contains(intent)) {
            throw new IllegalArgumentException("Unknown orchestration intent");
        }
        if (stepCount < 0 || stepCount > 32) {
            throw new IllegalArgumentException("Invalid orchestration step count");
        }
        evidence = evidence == null ? List.of() : List.copyOf(evidence);
        validations = validations == null ? List.of() : List.copyOf(validations);
        limitations = limitations == null ? List.of() : List.copyOf(limitations);
    }

    public record Evidence(
            String evidenceId,
            String kind,
            String title,
            String sourceVersion,
            String uri,
            Double score) {}

    public record Validation(String stage, boolean passed, String code, String detail) {}
}
