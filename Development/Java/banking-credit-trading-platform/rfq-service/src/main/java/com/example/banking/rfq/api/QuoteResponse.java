package com.example.banking.rfq.api;

import com.example.banking.rfq.domain.QuoteEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record QuoteResponse(String id, String rfqId, String traderId, BigDecimal quotePrice,
                            BigDecimal spreadBps, String status, Instant createdAt) {
    public static QuoteResponse from(QuoteEntity quote) {
        return new QuoteResponse(quote.getId(), quote.getRfqId(), quote.getTraderId(), quote.getQuotePrice(),
                quote.getSpreadBps(), quote.getStatus(), quote.getCreatedAt());
    }
}
