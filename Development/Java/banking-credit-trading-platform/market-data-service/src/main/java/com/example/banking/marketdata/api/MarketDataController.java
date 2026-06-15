package com.example.banking.marketdata.api;

import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.marketdata.service.MarketDataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market-data")
public class MarketDataController {
    private final MarketDataService service;

    public MarketDataController(MarketDataService service) {
        this.service = service;
    }

    @GetMapping("/{instrumentId}")
    public MarketDataResponse latest(@PathVariable String instrumentId) {
        return MarketDataResponse.from(service.latest(instrumentId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarketDataResponse ingest(@Valid @RequestBody MarketDataRequest request,
                                     @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return MarketDataResponse.from(service.ingest(request, correlationId));
    }
}
