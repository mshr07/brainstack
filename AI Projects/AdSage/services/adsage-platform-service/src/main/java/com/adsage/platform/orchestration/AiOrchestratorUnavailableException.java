package com.adsage.platform.orchestration;

public final class AiOrchestratorUnavailableException extends RuntimeException {

    public AiOrchestratorUnavailableException(Throwable cause) {
        super("AI orchestration is temporarily unavailable", cause);
    }
}
