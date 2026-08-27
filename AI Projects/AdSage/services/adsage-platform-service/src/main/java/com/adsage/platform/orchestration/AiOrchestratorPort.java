package com.adsage.platform.orchestration;

public interface AiOrchestratorPort {

    OrchestrationResponse orchestrate(OrchestrationRequest request, RequestContext context);
}
