# Low Latency Notes

The low-latency lab includes a simple ring buffer, a file-backed journal, a virtual-thread example, and a JMM visibility example. It explains concepts used by LMAX Disruptor, Aeron, and Chronicle Queue without forcing fragile native or specialized dependencies into the main build.

Kafka is excellent for durable distributed streams and replay. Aeron is useful for specialized low-latency messaging where teams can operate the extra complexity. Chronicle Queue is useful for fast persisted event journals. Most banking services should start with clear design, batching, backpressure, and observability before adopting niche low-latency stacks.
