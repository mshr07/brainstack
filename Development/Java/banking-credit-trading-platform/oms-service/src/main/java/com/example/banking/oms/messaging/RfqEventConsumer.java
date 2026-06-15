package com.example.banking.oms.messaging;

import com.example.banking.domain.event.RfqAcceptedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class RfqEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(RfqEventConsumer.class);

    @KafkaListener(topics = "rfq.accepted", groupId = "oms-service", autoStartup = "false")
    public void onAccepted(RfqAcceptedEvent event) {
        log.info("Received RFQ accepted event {}; demo keeps explicit order creation for clarity", event.aggregateId());
    }
}
