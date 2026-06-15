package com.example.banking.oms.service;

import com.example.banking.domain.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(DomainEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; skipped publish {}", event.eventType());
            return;
        }
        kafkaTemplate.send(event.eventType(), event.aggregateId(), event);
    }
}
