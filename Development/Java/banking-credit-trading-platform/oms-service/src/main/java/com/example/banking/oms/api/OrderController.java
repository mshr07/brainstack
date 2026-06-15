package com.example.banking.oms.api;

import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.oms.api.OrderRequests.CreateOrder;
import com.example.banking.oms.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrder request,
                                @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return OrderResponse.from(service.create(request, correlationId));
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable String orderId) {
        return OrderResponse.from(service.get(orderId));
    }

    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancel(@PathVariable String orderId) {
        return OrderResponse.from(service.cancel(orderId));
    }
}
