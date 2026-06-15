package com.example.banking.risk.service;

import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.Money;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.DuplicateOrderRule;
import com.example.banking.domain.risk.InstrumentRestrictionRule;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import com.example.banking.risk.api.RiskCheckRequest;
import com.example.banking.risk.domain.RiskDecisionEntity;
import com.example.banking.risk.repository.RiskDecisionRepository;
import com.example.banking.risk.repository.RiskLimitRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiskService {
    private final RiskLimitRepository limits;
    private final RiskDecisionRepository decisions;
    private final AtomicBoolean killSwitch = new AtomicBoolean(false);
    private final Set<String> seenIdempotencyKeys = ConcurrentHashMap.newKeySet();
    private final CompositeRiskEngine engine = new CompositeRiskEngine(List.of(
            new KillSwitchRule(), new InstrumentRestrictionRule(), new DuplicateOrderRule(), new MaxOrderNotionalRule()));

    public RiskService(RiskLimitRepository limits, RiskDecisionRepository decisions) {
        this.limits = limits;
        this.decisions = decisions;
    }

    @Transactional
    public RiskDecisionEntity check(RiskCheckRequest request) {
        var limit = limits.findByClientId(request.clientId())
                .orElseThrow(() -> new NotFoundException("Risk limit not found for client: " + request.clientId()));
        boolean duplicate = request.idempotencyKey() != null && !seenIdempotencyKeys.add(request.idempotencyKey());
        var decision = engine.evaluate(new RiskContext(request.clientId(), request.instrumentId(),
                new Money(request.orderNotional(), request.currency()),
                new Money(limit.getCurrentExposure(), limit.getCurrency()),
                new Money(limit.getDailyLimit(), limit.getCurrency()),
                limit.restrictedInstrumentSet().contains(request.instrumentId()),
                duplicate,
                killSwitch.get()));
        return decisions.save(new RiskDecisionEntity("risk-" + UUID.randomUUID(), request.clientId(), request.instrumentId(),
                request.orderNotional(), request.currency(), decision.status(), String.join("; ", decision.reasons())));
    }

    public boolean setKillSwitch(boolean enabled) {
        killSwitch.set(enabled);
        return killSwitch.get();
    }
}
