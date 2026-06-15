package com.example.banking.domain.model;

public enum OrderStatus {
    NEW,
    VALIDATED,
    RISK_REJECTED,
    ACCEPTED,
    ROUTED,
    EXECUTED,
    CANCELLED,
    FAILED
}
