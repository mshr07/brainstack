package com.example.banking.marketdata.service;

import com.example.banking.domain.event.MarketDataTickEvent;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.marketdata.api.InstrumentRequest;
import com.example.banking.marketdata.api.MarketDataRequest;
import com.example.banking.marketdata.domain.InstrumentEntity;
import com.example.banking.marketdata.domain.MarketDataTickEntity;
import com.example.banking.marketdata.messaging.MarketDataPublisher;
import com.example.banking.marketdata.repository.InstrumentRepository;
import com.example.banking.marketdata.repository.MarketDataTickRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketDataService {
    private final InstrumentRepository instruments;
    private final MarketDataTickRepository ticks;
    private final MarketDataPublisher publisher;

    public MarketDataService(InstrumentRepository instruments, MarketDataTickRepository ticks, MarketDataPublisher publisher) {
        this.instruments = instruments;
        this.ticks = ticks;
        this.publisher = publisher;
    }

    @Transactional
    public InstrumentEntity createInstrument(InstrumentRequest request) {
        return instruments.save(new InstrumentEntity(request.id(), request.isin(), request.name(), request.issuer(),
                request.instrumentType(), request.couponPercent(), request.maturityDate(), request.currency(), request.sector()));
    }

    @Transactional
    public MarketDataTickEntity ingest(MarketDataRequest request, String correlationId) {
        if (!instruments.existsById(request.instrumentId())) {
            throw new NotFoundException("Instrument not found: " + request.instrumentId());
        }
        MarketDataTickEntity tick = ticks.save(new MarketDataTickEntity(request.instrumentId(), request.bid(), request.ask(),
                request.yieldPercent(), request.spreadBps(), Instant.now()));
        publisher.publish(new MarketDataTickEvent(UUID.randomUUID().toString(), request.instrumentId(), correlationId,
                tick.getReceivedAt(), request.instrumentId(), tick.getBid(), tick.getAsk(), tick.getMid(),
                tick.getYieldPercent(), tick.getSpreadBps()));
        return tick;
    }

    @Transactional(readOnly = true)
    @Cacheable("marketDataSnapshot")
    public MarketDataTickEntity latest(String instrumentId) {
        return ticks.findFirstByInstrumentIdOrderByReceivedAtDesc(instrumentId)
                .orElseThrow(() -> new NotFoundException("No market data for instrument: " + instrumentId));
    }
}
