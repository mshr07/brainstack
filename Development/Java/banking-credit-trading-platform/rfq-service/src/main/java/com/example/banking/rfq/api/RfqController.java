package com.example.banking.rfq.api;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.rfq.api.RfqRequests.CreateRfq;
import com.example.banking.rfq.api.RfqRequests.GenerateQuote;
import com.example.banking.rfq.service.RfqService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rfqs")
public class RfqController {
    private final RfqService service;

    public RfqController(RfqService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RfqResponse create(@Valid @RequestBody CreateRfq request,
                              @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return RfqResponse.from(service.create(request, correlationId));
    }

    @GetMapping("/{rfqId}")
    public RfqResponse get(@PathVariable String rfqId) {
        return RfqResponse.from(service.get(rfqId));
    }

    @PatchMapping("/{rfqId}/status")
    public RfqResponse status(@PathVariable String rfqId, @RequestParam RfqStatus status) {
        return RfqResponse.from(service.updateStatus(rfqId, status));
    }

    @PostMapping("/{rfqId}/quote")
    public QuoteResponse quote(@PathVariable String rfqId, @Valid @RequestBody GenerateQuote request,
                               @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return QuoteResponse.from(service.quote(rfqId, request, correlationId));
    }

    @PostMapping("/{rfqId}/accept")
    public RfqResponse accept(@PathVariable String rfqId,
                              @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return RfqResponse.from(service.accept(rfqId, correlationId));
    }
}
