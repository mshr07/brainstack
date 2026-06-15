package com.example.banking.marketdata.domain;

import com.example.banking.domain.model.InstrumentType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "instruments")
public class InstrumentEntity {
    @Id
    private String id;
    private String isin;
    private String name;
    private String issuer;
    @Enumerated(EnumType.STRING)
    private InstrumentType instrumentType;
    private BigDecimal couponPercent;
    private LocalDate maturityDate;
    private String currency;
    private String sector;

    protected InstrumentEntity() {
    }

    public InstrumentEntity(String id, String isin, String name, String issuer, InstrumentType instrumentType,
                            BigDecimal couponPercent, LocalDate maturityDate, String currency, String sector) {
        this.id = id;
        this.isin = isin;
        this.name = name;
        this.issuer = issuer;
        this.instrumentType = instrumentType;
        this.couponPercent = couponPercent;
        this.maturityDate = maturityDate;
        this.currency = currency;
        this.sector = sector;
    }

    public String getId() { return id; }
    public String getIsin() { return isin; }
    public String getName() { return name; }
    public String getIssuer() { return issuer; }
    public InstrumentType getInstrumentType() { return instrumentType; }
    public BigDecimal getCouponPercent() { return couponPercent; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public String getCurrency() { return currency; }
    public String getSector() { return sector; }
}
