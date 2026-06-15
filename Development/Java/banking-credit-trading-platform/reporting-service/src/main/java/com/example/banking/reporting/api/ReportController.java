package com.example.banking.reporting.api;

import com.example.banking.reporting.domain.AuditEventEntity;
import com.example.banking.reporting.domain.IncidentRecordEntity;
import com.example.banking.reporting.repository.AuditEventRepository;
import com.example.banking.reporting.repository.IncidentRecordRepository;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private final AuditEventRepository auditEvents;
    private final IncidentRecordRepository incidents;

    public ReportController(AuditEventRepository auditEvents, IncidentRecordRepository incidents) {
        this.auditEvents = auditEvents;
        this.incidents = incidents;
    }

    @GetMapping("/audit")
    public PagedResponse<AuditEventEntity> audit(@RequestParam(defaultValue = "") String eventType, Pageable pageable) {
        var page = eventType.isBlank() ? auditEvents.findAll(pageable) : auditEvents.findByEventTypeContainingIgnoreCase(eventType, pageable);
        return PagedResponse.from(page);
    }

    @GetMapping("/risk-rejections")
    public List<Map<String, Object>> riskRejections() {
        return List.of(Map.of("clientId", "client-alpha", "reason", "Daily exposure limit would be breached", "count", 1));
    }

    @GetMapping("/mifid-export")
    public Map<String, Object> mifidExport() {
        return Map.of("reportType", "SIMULATED_MIFID_II", "records", auditEvents.count(), "disclaimer", "Educational simulation only");
    }

    @GetMapping("/incidents")
    public List<IncidentRecordEntity> incidents() {
        return incidents.findAll();
    }
}
