package com.example.banking.risk.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RiskCheckRequest(@NotBlank String clientId, @NotBlank String instrumentId,
                               @Positive BigDecimal orderNotional, @NotBlank String currency,
                               String idempotencyKey) {
}
