package com.example.banking.domain.risk;

import com.example.banking.domain.model.Money;

public record RiskContext(
        String clientId,
        String instrumentId,
        Money orderNotional,
        Money clientDailyExposure,
        Money clientDailyLimit,
        boolean instrumentRestricted,
        boolean duplicateOrder,
        boolean killSwitchEnabled) {
}
