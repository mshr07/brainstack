package com.example.banking.fix.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FixParser {
    public FixMessage parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("FIX message is required");
        }
        Map<Integer, String> tags = new LinkedHashMap<>();
        String normalized = raw.replace('\u0001', '|');
        for (String token : normalized.split("\\|")) {
            if (token.isBlank()) {
                continue;
            }
            int eq = token.indexOf('=');
            if (eq <= 0) {
                throw new IllegalArgumentException("Invalid FIX token: " + token);
            }
            tags.put(Integer.parseInt(token.substring(0, eq)), token.substring(eq + 1));
        }
        if (!tags.containsKey(35)) {
            throw new IllegalArgumentException("FIX message type tag 35 is required");
        }
        return new FixMessage(tags);
    }

    public String newOrderSingle(String clientOrderId, String symbol, String side, String quantity, String price) {
        return "8=FIX.4.4|35=D|11=" + clientOrderId + "|55=" + symbol + "|54=" + side + "|38=" + quantity + "|44=" + price + "|";
    }

    public String executionReport(String clientOrderId, String orderId, String execType, String ordStatus) {
        return "8=FIX.4.4|35=8|11=" + clientOrderId + "|37=" + orderId + "|150=" + execType + "|39=" + ordStatus + "|";
    }

    public String quoteRequest(String rfqId, String symbol) {
        return "8=FIX.4.4|35=R|131=" + rfqId + "|55=" + symbol + "|";
    }

    public String quote(String quoteId, String rfqId, String bid, String ask) {
        return "8=FIX.4.4|35=S|117=" + quoteId + "|131=" + rfqId + "|132=" + bid + "|133=" + ask + "|";
    }
}
