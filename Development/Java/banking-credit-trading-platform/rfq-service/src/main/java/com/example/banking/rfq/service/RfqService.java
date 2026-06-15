package com.example.banking.rfq.service;

import com.example.banking.domain.event.DomainEventFactory;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.RfqStatus;
import com.example.banking.rfq.api.RfqRequests.CreateRfq;
import com.example.banking.rfq.api.RfqRequests.GenerateQuote;
import com.example.banking.rfq.cache.RfqCache;
import com.example.banking.rfq.domain.OutboxEventEntity;
import com.example.banking.rfq.domain.QuoteEntity;
import com.example.banking.rfq.domain.RfqEntity;
import com.example.banking.rfq.repository.OutboxEventRepository;
import com.example.banking.rfq.repository.QuoteRepository;
import com.example.banking.rfq.repository.RfqRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RfqService {
    private final RfqRepository rfqs;
    private final QuoteRepository quotes;
    private final OutboxEventRepository outbox;
    private final RfqCache cache;
    private final RfqEventPublisher publisher;

    public RfqService(RfqRepository rfqs, QuoteRepository quotes, OutboxEventRepository outbox,
                      RfqCache cache, RfqEventPublisher publisher) {
        this.rfqs = rfqs;
        this.quotes = quotes;
        this.outbox = outbox;
        this.cache = cache;
        this.publisher = publisher;
    }

    @Transactional
    public RfqEntity create(CreateRfq request, String correlationId) {
        String id = "rfq-" + UUID.randomUUID();
        RfqEntity rfq = rfqs.save(new RfqEntity(id, request.clientId(), request.instrumentId(), request.side(),
                request.notional(), request.currency()));
        cache.putActive(id, rfq.getStatus().name());
        var event = DomainEventFactory.rfqCreated(id, correlationId, request.clientId(), request.instrumentId(),
                request.side(), request.notional());
        outbox.save(new OutboxEventEntity(event.eventId(), id, event.eventType(), event.toString()));
        publisher.publish(event);
        return rfq;
    }

    @Transactional
    public QuoteEntity quote(String rfqId, GenerateQuote request, String correlationId) {
        RfqEntity rfq = get(rfqId);
        QuoteEntity quote = quotes.save(new QuoteEntity("quote-" + UUID.randomUUID(), rfqId, request.traderId(),
                request.quotePrice(), request.spreadBps()));
        rfq.markQuoted();
        cache.putActive(rfqId, rfq.getStatus().name());
        var event = DomainEventFactory.rfqQuoted(rfqId, correlationId, request.traderId(), request.quotePrice(), request.spreadBps());
        outbox.save(new OutboxEventEntity(event.eventId(), rfqId, event.eventType(), event.toString()));
        publisher.publish(event);
        return quote;
    }

    @Transactional
    public RfqEntity accept(String rfqId, String correlationId) {
        RfqEntity rfq = get(rfqId);
        QuoteEntity quote = quotes.findFirstByRfqIdOrderByCreatedAtDesc(rfqId)
                .orElseThrow(() -> new NotFoundException("Quote not found for RFQ: " + rfqId));
        quote.accept();
        rfq.accept();
        cache.putActive(rfqId, rfq.getStatus().name());
        var event = DomainEventFactory.rfqAccepted(rfqId, correlationId, quote.getId(), rfq.getClientId());
        outbox.save(new OutboxEventEntity(event.eventId(), rfqId, event.eventType(), event.toString()));
        publisher.publish(event);
        return rfq;
    }

    @Transactional
    public RfqEntity updateStatus(String rfqId, RfqStatus status) {
        RfqEntity rfq = get(rfqId);
        rfq.updateStatus(status);
        cache.putActive(rfqId, status.name());
        return rfq;
    }

    @Transactional(readOnly = true)
    public RfqEntity get(String rfqId) {
        return rfqs.findById(rfqId).orElseThrow(() -> new NotFoundException("RFQ not found: " + rfqId));
    }
}
