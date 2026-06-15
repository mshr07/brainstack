package com.example.banking.marketdata.messaging;

import com.example.banking.domain.event.MarketDataTickEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MarketDataPublisher {
    private static final Logger log = LoggerFactory.getLogger(MarketDataPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public MarketDataPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(MarketDataTickEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; market data event retained in database only");
            return;
        }
        kafkaTemplate.send(event.eventType(), event.instrumentId(), event);
    }
}
