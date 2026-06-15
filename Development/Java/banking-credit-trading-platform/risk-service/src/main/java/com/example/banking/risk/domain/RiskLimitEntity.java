package com.example.banking.risk.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "risk_limits")
public class RiskLimitEntity {
    @Id
    private String id;
    private String clientId;
    private String currency;
    private BigDecimal dailyLimit;
    private BigDecimal currentExposure;
    private String restrictedInstruments;

    protected RiskLimitEntity() {
    }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getCurrency() { return currency; }
    public BigDecimal getDailyLimit() { return dailyLimit; }
    public BigDecimal getCurrentExposure() { return currentExposure; }
    public Set<String> restrictedInstrumentSet() {
        if (restrictedInstruments == null || restrictedInstruments.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(restrictedInstruments.split(",")).map(String::trim).collect(Collectors.toSet());
    }
}
