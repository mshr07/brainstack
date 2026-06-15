package com.example.banking.gateway;

import com.example.banking.gateway.security.JwtProperties;
import com.example.banking.gateway.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {
    @Test
    void issuesAndVerifiesToken() {
        JwtService service = new JwtService(new JwtProperties("test-secret-with-at-least-32-characters", 60), new ObjectMapper());
        var token = service.issue("trader", List.of("TRADER"));
        var payload = service.verify(token);
        assertEquals("trader", payload.get("sub"));
    }
}
