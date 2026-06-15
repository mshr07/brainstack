package com.example.banking.latency;

public class JmmVisibilityDemo {
    private volatile boolean running = true;
    private long counter;

    public void runLoop() {
        while (running) {
            counter++;
        }
    }

    public void stop() {
        running = false;
    }

    public long counter() {
        return counter;
    }
}
