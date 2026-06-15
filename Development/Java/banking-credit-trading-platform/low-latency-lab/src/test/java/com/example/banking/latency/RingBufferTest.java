package com.example.banking.latency;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RingBufferTest {
    @Test
    void storesLatestEventBySequence() {
        RingBuffer<String> buffer = new RingBuffer<>(8);
        long seq = buffer.publish("tick-1");
        assertEquals("tick-1", buffer.get(seq));
    }
}
