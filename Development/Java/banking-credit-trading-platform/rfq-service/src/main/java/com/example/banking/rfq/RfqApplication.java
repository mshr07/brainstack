package com.example.banking.rfq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class RfqApplication {
    public static void main(String[] args) {
        SpringApplication.run(RfqApplication.class, args);
    }
}
