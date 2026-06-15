package com.example.banking.domain.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CleanPricePricingStrategy implements PricingStrategy {
    private static final BigDecimal PAR = new BigDecimal("100.00");

    @Override
    public QuotePrice price(PricingRequest request) {
        BigDecimal duration = BigDecimal.valueOf(Math.max(1, request.yearsToMaturity()) * 0.85d);
        BigDecimal yieldPenalty = request.marketYieldPercent()
                .subtract(request.couponPercent())
                .multiply(duration)
                .divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP);
        BigDecimal spreadPenalty = request.spreadBps()
                .divide(new BigDecimal("10000"), 8, RoundingMode.HALF_UP)
                .multiply(duration)
                .multiply(PAR);
        BigDecimal clean = PAR.subtract(yieldPenalty.multiply(PAR)).subtract(spreadPenalty)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal dirty = clean.add(request.couponPercent().divide(new BigDecimal("4"), 4, RoundingMode.HALF_UP));
        BigDecimal dv01 = request.notional().amount()
                .multiply(duration)
                .multiply(new BigDecimal("0.0001"))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal settlement = request.notional().amount()
                .multiply(dirty)
                .divide(PAR, 2, RoundingMode.HALF_UP);
        return new QuotePrice(clean, dirty, request.spreadBps(), dv01,
                new com.example.banking.domain.model.Money(settlement, request.notional().currency()));
    }
}
