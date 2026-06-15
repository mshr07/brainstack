package com.example.banking.domain.pricing;

import com.example.banking.domain.model.Money;
import java.math.BigDecimal;

public record QuotePrice(
        BigDecimal cleanPrice,
        BigDecimal dirtyPrice,
        BigDecimal spreadBps,
        BigDecimal dv01,
        Money estimatedSettlementAmount) {
}
