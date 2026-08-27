package com.adsage.platform.conversation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.adsage.platform.observability.CorrelationIdFilter;
import com.adsage.platform.security.SecurityConfig;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = MessageController.class,
        properties = {
            "adsage.security.issuer=https://issuer.example.test",
            "adsage.security.audience=api://adsage",
            "adsage.security.dev-hmac-secret=test-development-secret-at-least-32-bytes"
        })
@Import({SecurityConfig.class, CorrelationIdFilter.class})
@EnableConfigurationProperties(com.adsage.platform.security.PlatformSecurityProperties.class)
class MessageControllerSecurityTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ConversationApplicationService conversationService;

    @Test
    void rejectsAnonymousCaller() throws Exception {
        mockMvc.perform(
                        post("/v1/conversations/{id}/messages", UUID.randomUUID())
                                .header("Idempotency-Key", "idempotency-key-1234")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"question":"What is ROAS?","clientTimezone":"UTC","locale":"en-US"}
                                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void acceptsAuthorizedCallerAndReturnsRequestId() throws Exception {
        UUID conversationId = UUID.randomUUID();
        UUID runId = UUID.randomUUID();
        when(conversationService.submit(any(), any(), any(), any(), any()))
                .thenReturn(
                        new RunAccepted(
                                runId,
                                conversationId,
                                "request-test-1234",
                                "completed",
                                "/v1/runs/" + runId,
                                "/v1/runs/" + runId + "/events",
                                new RunAccepted.GroundedAnswer(
                                        "Foundation response",
                                        "metadata",
                                        List.of(),
                                        List.of("Phase 1 limitation"))));

        mockMvc.perform(
                        post("/v1/conversations/{id}/messages", conversationId)
                                .with(
                                        jwt().jwt(
                                                        token ->
                                                                token.subject("user-1")
                                                                        .claim(
                                                                                "tenant_id",
                                                                                "tenant-a"))
                                                .authorities(
                                                        new SimpleGrantedAuthority(
                                                                "SCOPE_analysis:run")))
                                .header("Idempotency-Key", "idempotency-key-1234")
                                .header("X-Request-Id", "request-test-1234")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"question":"What is ROAS?","clientTimezone":"UTC","locale":"en-US"}
                                        """))
                .andExpect(status().isAccepted())
                .andExpect(header().string("X-Request-Id", "request-test-1234"))
                .andExpect(jsonPath("$.state").value("completed"))
                .andExpect(jsonPath("$.answer.intent").value("metadata"));
    }
}
