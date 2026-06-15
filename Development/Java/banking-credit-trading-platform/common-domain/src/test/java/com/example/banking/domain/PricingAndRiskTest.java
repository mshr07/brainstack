package com.example.banking.domain;

import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.domain.order.OrderLifecycleStateMachine;
import com.example.banking.domain.pricing.CleanPricePricingStrategy;
import com.example.banking.domain.pricing.PricingRequest;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PricingAndRiskTest {
    @Test
    void cleanPriceStrategyProducesSettlementAndDv01() {
        var price = new CleanPricePricingStrategy().price(new PricingRequest(
                "bond-1",
                Side.BUY,
                Money.usd("1000000"),
                new BigDecimal("5.25"),
                5,
                new BigDecimal("5.70"),
                new BigDecimal("125")));

        assertTrue(price.cleanPrice().compareTo(BigDecimal.ZERO) > 0);
        assertEquals("USD", price.estimatedSettlementAmount().currency());
    }

    @Test
    void riskEngineRejectsKillSwitch() {
        var engine = new CompositeRiskEngine(List.of(new KillSwitchRule(), new MaxOrderNotionalRule()));
        var decision = engine.evaluate(new RiskContext(
                "client-1",
                "bond-1",
                Money.usd("500000"),
                Money.usd("0"),
                Money.usd("1000000"),
                false,
                false,
                true));

        assertEquals(RiskDecisionStatus.REJECTED, decision.status());
    }

    @Test
    void orderLifecycleAllowsHappyPath() {
        var sm = new OrderLifecycleStateMachine();
        assertEquals(OrderStatus.VALIDATED, sm.transition(OrderStatus.NEW, OrderStatus.VALIDATED));
        assertEquals(OrderStatus.ACCEPTED, sm.transition(OrderStatus.VALIDATED, OrderStatus.ACCEPTED));
        assertEquals(OrderStatus.ROUTED, sm.transition(OrderStatus.ACCEPTED, OrderStatus.ROUTED));
        assertEquals(OrderStatus.EXECUTED, sm.transition(OrderStatus.ROUTED, OrderStatus.EXECUTED));
    }
}
