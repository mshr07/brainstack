package com.example.banking.risk.messaging;

import com.example.banking.domain.event.OrderCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class RiskEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(RiskEventConsumer.class);

    @KafkaListener(topics = "order.created", groupId = "risk-service", autoStartup = "false")
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("Received order event {} for asynchronous risk analytics", event.aggregateId());
    }
}
