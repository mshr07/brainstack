package com.example.banking.oms.api;

import com.example.banking.domain.model.Side;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public final class OrderRequests {
    private OrderRequests() {
    }

    public record CreateOrder(@NotBlank String rfqId, String quoteId, @NotBlank String clientId,
                              @NotBlank String instrumentId, @NotNull Side side, @Positive BigDecimal notional,
                              @NotBlank String currency, @NotBlank String idempotencyKey) {
    }
}
