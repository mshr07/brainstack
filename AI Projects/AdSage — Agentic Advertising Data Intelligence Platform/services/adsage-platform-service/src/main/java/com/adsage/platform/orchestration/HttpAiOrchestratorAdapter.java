package com.adsage.platform.orchestration;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
final class HttpAiOrchestratorAdapter implements AiOrchestratorPort {

    private final RestClient restClient;
    private final AiOrchestratorProperties properties;

    HttpAiOrchestratorAdapter(RestClient restClient, AiOrchestratorProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public OrchestrationResponse orchestrate(OrchestrationRequest request, RequestContext context) {
        try {
            OrchestrationResponse response =
                    restClient
                            .post()
                            .uri("/internal/v1/orchestrations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .headers(
                                    headers -> {
                                        headers.setBearerAuth(properties.internalToken());
                                        headers.set("X-Request-Id", context.requestId());
                                        if (context.traceparent() != null
                                                && !context.traceparent().isBlank()) {
                                            headers.set("traceparent", context.traceparent());
                                        }
                                    })
                            .body(request)
                            .retrieve()
                            .body(OrchestrationResponse.class);
            if (response == null) {
                throw new AiOrchestratorUnavailableException(
                        new IllegalStateException("AI orchestrator returned an empty response"));
            }
            if (!request.runId().equals(response.runId())
                    || !context.requestId().equals(response.requestId())) {
                throw new AiOrchestratorUnavailableException(
                        new IllegalStateException("AI orchestrator response identity mismatch"));
            }
            return response;
        } catch (RestClientException exception) {
            // Do not retry here: the public mutation is not durable/idempotent until Phase 3.
            throw new AiOrchestratorUnavailableException(exception);
        }
    }
}
