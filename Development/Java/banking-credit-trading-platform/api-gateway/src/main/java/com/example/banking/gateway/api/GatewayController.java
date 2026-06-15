package com.example.banking.gateway.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class GatewayController {
    @GetMapping("/gateway/routes")
    public Map<String, String> routes() {
        return Map.of(
                "market-data-service", "http://localhost:8081/api/v1",
                "rfq-service", "http://localhost:8082/api/v1",
                "oms-service", "http://localhost:8083/api/v1",
                "risk-service", "http://localhost:8084/api/v1",
                "reporting-service", "http://localhost:8086/api/v1");
    }

    @GetMapping("/support/incidents")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public List<Map<String, Object>> incidents() {
        return List.of(Map.of(
                "id", "incident-demo-1",
                "title", "Market data stale",
                "severity", "P2",
                "status", "OPEN",
                "createdAt", Instant.now().minusSeconds(1800).toString()));
    }

    @PostMapping("/support/incidents")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public Map<String, Object> createIncident(@RequestBody Map<String, Object> request) {
        return Map.of("id", "incident-" + System.currentTimeMillis(), "status", "OPEN", "input", request);
    }
}
