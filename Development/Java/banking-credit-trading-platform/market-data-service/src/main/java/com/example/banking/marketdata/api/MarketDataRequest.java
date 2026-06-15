package com.example.banking.marketdata.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record MarketDataRequest(
        @NotBlank String instrumentId,
        @Positive BigDecimal bid,
        @Positive BigDecimal ask,
        @Positive BigDecimal yieldPercent,
        @Positive BigDecimal spreadBps) {
}
