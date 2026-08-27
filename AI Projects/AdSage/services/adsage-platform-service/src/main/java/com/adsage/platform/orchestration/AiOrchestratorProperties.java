package com.adsage.platform.orchestration;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("adsage.ai-orchestrator")
public record AiOrchestratorProperties(
        URI baseUrl, String internalToken, Duration connectTimeout, Duration readTimeout) {}
