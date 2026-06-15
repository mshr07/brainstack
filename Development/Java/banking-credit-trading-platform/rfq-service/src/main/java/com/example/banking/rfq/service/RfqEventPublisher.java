package com.example.banking.rfq.service;

import com.example.banking.domain.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class RfqEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(RfqEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public RfqEventPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(DomainEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; outbox still records {}", event.eventType());
            return;
        }
        kafkaTemplate.send(event.eventType(), event.aggregateId(), event);
    }
}
