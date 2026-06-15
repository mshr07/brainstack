package com.example.banking.rfq.api;

import com.example.banking.domain.model.Side;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public final class RfqRequests {
    private RfqRequests() {
    }

    public record CreateRfq(@NotBlank String clientId, @NotBlank String instrumentId, @NotNull Side side,
                            @Positive BigDecimal notional, @NotBlank String currency) {
    }

    public record GenerateQuote(@NotBlank String traderId, @Positive BigDecimal quotePrice,
                                @Positive BigDecimal spreadBps) {
    }
}
