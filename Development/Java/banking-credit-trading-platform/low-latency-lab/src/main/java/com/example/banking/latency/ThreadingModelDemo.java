package com.example.banking.latency;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadingModelDemo {
    public List<String> priceInParallel(List<String> instruments) {
        try (ExecutorService executor = Executors.newFixedThreadPool(4)) {
            return instruments.stream()
                    .map(instrument -> CompletableFuture.supplyAsync(() -> "priced:" + instrument, executor))
                    .map(CompletableFuture::join)
                    .toList();
        }
    }

    public List<String> priceWithVirtualThreads(List<String> instruments) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            return instruments.stream()
                    .map(instrument -> CompletableFuture.supplyAsync(() -> "priced:" + instrument, executor))
                    .map(CompletableFuture::join)
                    .toList();
        }
    }
}
