package com.example.banking.marketdata.api;

import com.example.banking.domain.model.InstrumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InstrumentRequest(
        @NotBlank String id,
        @NotBlank String isin,
        @NotBlank String name,
        @NotBlank String issuer,
        @NotNull InstrumentType instrumentType,
        @Positive BigDecimal couponPercent,
        @NotNull LocalDate maturityDate,
        @NotBlank String currency,
        @NotBlank String sector) {
}
