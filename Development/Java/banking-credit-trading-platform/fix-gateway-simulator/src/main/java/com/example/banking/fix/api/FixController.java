package com.example.banking.fix.api;

import com.example.banking.fix.domain.FixMessage;
import com.example.banking.fix.domain.FixParser;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fix")
public class FixController {
    private final FixParser parser;

    public FixController(FixParser parser) {
        this.parser = parser;
    }

    public record ParseRequest(@NotBlank String message) {
    }

    @PostMapping("/parse")
    public Map<Integer, String> parse(@RequestBody ParseRequest request) {
        FixMessage message = parser.parse(request.message());
        return message.tags();
    }

    @GetMapping("/new-order-single")
    public String newOrder(@RequestParam String clientOrderId, @RequestParam String symbol,
                           @RequestParam(defaultValue = "1") String side,
                           @RequestParam(defaultValue = "1000000") String quantity,
                           @RequestParam(defaultValue = "99.875") String price) {
        return parser.newOrderSingle(clientOrderId, symbol, side, quantity, price);
    }
}
