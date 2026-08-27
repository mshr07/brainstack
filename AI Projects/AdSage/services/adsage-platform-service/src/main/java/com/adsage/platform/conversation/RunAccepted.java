package com.adsage.platform.conversation;

import java.util.List;
import java.util.UUID;

public record RunAccepted(
        UUID runId,
        UUID conversationId,
        String requestId,
        String state,
        String statusUrl,
        String eventsUrl,
        GroundedAnswer answer) {

    public record GroundedAnswer(
            String text, String intent, List<Citation> citations, List<String> limitations) {}

    public record Citation(String evidenceId, String title, String sourceVersion, String uri) {}
}
