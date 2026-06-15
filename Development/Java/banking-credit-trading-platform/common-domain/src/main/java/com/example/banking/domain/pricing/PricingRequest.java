package com.example.banking.domain.pricing;

import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.Side;
import java.math.BigDecimal;

public record PricingRequest(
        String instrumentId,
        Side side,
        Money notional,
        BigDecimal couponPercent,
        int yearsToMaturity,
        BigDecimal marketYieldPercent,
        BigDecimal spreadBps) {
}
