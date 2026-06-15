package com.example.banking.risk.api;

import com.example.banking.risk.service.RiskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/risk")
public class RiskController {
    private final RiskService service;

    public RiskController(RiskService service) {
        this.service = service;
    }

    @PostMapping("/check")
    public RiskDecisionResponse check(@Valid @RequestBody RiskCheckRequest request) {
        return RiskDecisionResponse.from(service.check(request));
    }

    @PostMapping("/kill-switch")
    public KillSwitchRequest killSwitch(@RequestBody KillSwitchRequest request) {
        return new KillSwitchRequest(service.setKillSwitch(request.enabled()));
    }
}
