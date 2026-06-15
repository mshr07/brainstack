package com.example.banking.marketdata.api;

import com.example.banking.marketdata.repository.InstrumentRepository;
import com.example.banking.marketdata.service.MarketDataService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/instruments")
public class InstrumentController {
    private final InstrumentRepository instruments;
    private final MarketDataService service;

    public InstrumentController(InstrumentRepository instruments, MarketDataService service) {
        this.instruments = instruments;
        this.service = service;
    }

    @GetMapping
    public PagedResponse<InstrumentResponse> list(@RequestParam(required = false) String issuer, Pageable pageable) {
        var page = issuer == null || issuer.isBlank()
                ? instruments.findAll(pageable)
                : instruments.findByIssuerContainingIgnoreCase(issuer, pageable);
        return PagedResponse.from(page.map(InstrumentResponse::from));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InstrumentResponse create(@Valid @RequestBody InstrumentRequest request) {
        return InstrumentResponse.from(service.createInstrument(request));
    }
}
