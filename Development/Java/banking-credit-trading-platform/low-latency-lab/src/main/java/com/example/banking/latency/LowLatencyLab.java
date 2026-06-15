package com.example.banking.latency;

public class LowLatencyLab {
    public static void main(String[] args) {
        RingBuffer<String> ring = new RingBuffer<>(1024);
        long seq = ring.publish("market-data-tick");
        System.out.println("Published sequence " + seq + " value=" + ring.get(seq));
    }
}
