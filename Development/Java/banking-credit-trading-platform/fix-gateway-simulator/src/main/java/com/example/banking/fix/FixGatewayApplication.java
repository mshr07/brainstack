package com.example.banking.fix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class FixGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(FixGatewayApplication.class, args);
    }
}
