package com.adsage.platform.conversation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.adsage.platform.orchestration.AiOrchestratorPort;
import com.adsage.platform.orchestration.OrchestrationRequest;
import com.adsage.platform.orchestration.OrchestrationResponse;
import com.adsage.platform.orchestration.RequestContext;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class DefaultConversationApplicationServiceTest {

    private static final Instant NOW = Instant.parse("2026-08-27T10:00:00Z");

    @Test
    void derivesTenantAndCapabilitiesFromVerifiedPrincipal() {
        AiOrchestratorPort port = mock(AiOrchestratorPort.class);
        UUID conversationId = UUID.randomUUID();
        when(port.orchestrate(any(), any()))
                .thenAnswer(
                        invocation -> {
                            OrchestrationRequest request = invocation.getArgument(0);
                            return new OrchestrationResponse(
                                    request.runId(),
                                    "request-12345678",
                                    "completed",
                                    "metadata",
                                    3,
                                    "Foundation response",
                                    List.of(),
                                    List.of(),
                                    List.of("Phase 1"));
                        });
        var service =
                new DefaultConversationApplicationService(port, Clock.fixed(NOW, ZoneOffset.UTC));
        var authentication = authentication(Map.of("tenant_id", "tenant-a"));

        RunAccepted accepted =
                service.submit(
                        conversationId,
                        new SubmitMessageRequest("What is ROAS?", "UTC", "en-US"),
                        "idempotency-key-1234",
                        authentication,
                        new RequestContext("request-12345678", null));

        var captor = ArgumentCaptor.forClass(OrchestrationRequest.class);
        verify(port).orchestrate(captor.capture(), any());
        assertThat(captor.getValue().tenantId()).isEqualTo("tenant-a");
        assertThat(captor.getValue().subjectId()).isEqualTo("user-1");
        assertThat(captor.getValue().capabilities()).containsExactly("analysis:run");
        assertThat(captor.getValue().deadlineAt()).isEqualTo(NOW.plusSeconds(10));
        assertThat(accepted.state()).isEqualTo("completed");
        assertThat(accepted.answer().limitations()).containsExactly("Phase 1");
    }

    @Test
    void rejectsTokenWithoutServerTenantClaim() {
        var service =
                new DefaultConversationApplicationService(
                        mock(AiOrchestratorPort.class), Clock.fixed(NOW, ZoneOffset.UTC));

        assertThatThrownBy(
                        () ->
                                service.submit(
                                        UUID.randomUUID(),
                                        new SubmitMessageRequest("What is ROAS?", "UTC", "en-US"),
                                        "idempotency-key-1234",
                                        authentication(Map.of()),
                                        new RequestContext("request-12345678", null)))
                .isInstanceOf(AccessDeniedException.class);
    }

    private JwtAuthenticationToken authentication(Map<String, Object> extraClaims) {
        var claims = new java.util.HashMap<String, Object>();
        claims.put("sub", "user-1");
        claims.putAll(extraClaims);
        Jwt jwt =
                new Jwt(
                        "token",
                        NOW.minusSeconds(5),
                        NOW.plusSeconds(300),
                        Map.of("alg", "none"),
                        claims);
        return new JwtAuthenticationToken(
                jwt,
                List.of(
                        new SimpleGrantedAuthority("SCOPE_analysis:run"),
                        new SimpleGrantedAuthority("SCOPE_approval:decide")));
    }
}
