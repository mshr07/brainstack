package com.example.banking.marketdata.api;

import com.example.banking.domain.model.InstrumentType;
import com.example.banking.marketdata.domain.InstrumentEntity;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InstrumentResponse(String id, String isin, String name, String issuer, InstrumentType instrumentType,
                                 BigDecimal couponPercent, LocalDate maturityDate, String currency, String sector) {
    public static InstrumentResponse from(InstrumentEntity entity) {
        return new InstrumentResponse(entity.getId(), entity.getIsin(), entity.getName(), entity.getIssuer(),
                entity.getInstrumentType(), entity.getCouponPercent(), entity.getMaturityDate(), entity.getCurrency(), entity.getSector());
    }
}
