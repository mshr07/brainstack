package com.adsage.platform.conversation;

import com.adsage.platform.orchestration.AiOrchestratorPort;
import com.adsage.platform.orchestration.OrchestrationRequest;
import com.adsage.platform.orchestration.RequestContext;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
final class DefaultConversationApplicationService implements ConversationApplicationService {

    private static final Duration RUN_DEADLINE = Duration.ofSeconds(10);
    private static final Set<String> DELEGATABLE_AI_CAPABILITIES =
            Set.of("analysis:run", "metadata:read", "query:execute");
    private final AiOrchestratorPort aiOrchestrator;
    private final Clock clock;

    DefaultConversationApplicationService(AiOrchestratorPort aiOrchestrator) {
        this(aiOrchestrator, Clock.systemUTC());
    }

    DefaultConversationApplicationService(AiOrchestratorPort aiOrchestrator, Clock clock) {
        this.aiOrchestrator = aiOrchestrator;
        this.clock = clock;
    }

    @Override
    public RunAccepted submit(
            UUID conversationId,
            SubmitMessageRequest message,
            String idempotencyKey,
            JwtAuthenticationToken principal,
            RequestContext requestContext) {
        String tenantId = principal.getToken().getClaimAsString("tenant_id");
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException("A server-issued tenant claim is required");
        }
        String subjectId = principal.getToken().getSubject();
        if (subjectId == null || subjectId.isBlank()) {
            throw new AccessDeniedException("A server-issued subject claim is required");
        }
        List<String> capabilities =
                principal.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(authority -> authority.startsWith("SCOPE_"))
                        .map(authority -> authority.substring("SCOPE_".length()))
                        .filter(DELEGATABLE_AI_CAPABILITIES::contains)
                        .sorted()
                        .toList();
        UUID runId = UUID.randomUUID();
        Instant deadline = clock.instant().plus(RUN_DEADLINE);
        var request =
                new OrchestrationRequest(
                        runId,
                        conversationId,
                        tenantId,
                        subjectId,
                        capabilities,
                        message.question(),
                        message.clientTimezone(),
                        message.locale() == null ? "en-US" : message.locale(),
                        deadline,
                        new OrchestrationRequest.Budgets(8, 1, 8000, 1500, 6, 1_000_000, 0.25));
        var result = aiOrchestrator.orchestrate(request, requestContext);
        var citations =
                result.evidence().stream()
                        .map(
                                evidence ->
                                        new RunAccepted.Citation(
                                                evidence.evidenceId(),
                                                evidence.title(),
                                                evidence.sourceVersion(),
                                                evidence.uri()))
                        .toList();
        var answer =
                new RunAccepted.GroundedAnswer(
                        result.answer(), result.intent(), citations, result.limitations());
        return new RunAccepted(
                runId,
                conversationId,
                requestContext.requestId(),
                result.state(),
                "/v1/runs/" + runId,
                "/v1/runs/" + runId + "/events",
                answer);
    }
}
