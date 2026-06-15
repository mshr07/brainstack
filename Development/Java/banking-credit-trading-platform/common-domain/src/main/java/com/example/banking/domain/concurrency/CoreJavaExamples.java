package com.example.banking.domain.concurrency;

import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public class CoreJavaExamples {
    private final Map<String, String> activeRfqs = new ConcurrentHashMap<>();
    private final BlockingQueue<String> auditQueue = new LinkedBlockingQueue<>(1024);
    private final AtomicLong sequence = new AtomicLong();
    private final ReentrantLock publishLock = new ReentrantLock();
    private volatile boolean running = true;

    public long nextSequence() {
        return sequence.incrementAndGet();
    }

    public CompletableFuture<String> enrichAsync(String rfqId) {
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            return CompletableFuture.supplyAsync(() -> activeRfqs.getOrDefault(rfqId, "missing"), executor);
        }
    }

    public void publishWithBackpressure(String event) throws InterruptedException {
        if (!auditQueue.offer(event, 250, TimeUnit.MILLISECONDS)) {
            throw new IllegalStateException("audit queue is saturated");
        }
    }

    public void publishSingleWriter(String key, String value) {
        publishLock.lock();
        try {
            activeRfqs.put(key, value);
        } finally {
            publishLock.unlock();
        }
    }

    public synchronized void stop() {
        running = false;
    }

    public boolean isRunning() {
        return running;
    }
}
