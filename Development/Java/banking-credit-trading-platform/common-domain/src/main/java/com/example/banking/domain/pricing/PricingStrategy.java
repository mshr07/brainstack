package com.example.banking.domain.pricing;

public interface PricingStrategy {
    QuotePrice price(PricingRequest request);
}
