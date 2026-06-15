package com.example.banking.latency;

import java.util.concurrent.atomic.AtomicLong;

public class RingBuffer<T> {
    private final Object[] slots;
    private final int mask;
    private final AtomicLong sequence = new AtomicLong(-1);

    public RingBuffer(int powerOfTwoCapacity) {
        if (Integer.bitCount(powerOfTwoCapacity) != 1) {
            throw new IllegalArgumentException("capacity must be a power of two");
        }
        this.slots = new Object[powerOfTwoCapacity];
        this.mask = powerOfTwoCapacity - 1;
    }

    public long publish(T event) {
        long seq = sequence.incrementAndGet();
        slots[(int) seq & mask] = event;
        return seq;
    }

    @SuppressWarnings("unchecked")
    public T get(long seq) {
        return (T) slots[(int) seq & mask];
    }

    public long cursor() {
        return sequence.get();
    }
}
