# Java Performance Notes

Heap stores objects such as RFQs, orders, cached snapshots, and event payloads. Thread stacks store method frames and local variables. Metaspace stores class metadata. GC roots include thread stacks, static fields, JNI references, and active class loaders.

Trading services care about allocation rate because frequent allocation creates GC pressure. Local experiments should start with measurements: JFR, Micrometer metrics, GC logs, and load tests. Example flags:

```bash
-XX:+UseG1GC -Xms512m -Xmx512m -Xlog:gc*:file=gc.log:time,uptime,level,tags
-XX:+UseZGC -Xms1g -Xmx1g
```

JMM basics: volatile provides visibility, synchronized creates mutual exclusion and happens-before edges, AtomicLong provides lock-free atomic increments, and safe publication prevents other threads from observing partially constructed objects.

False sharing can happen when independent hot fields share a cache line. Avoid premature tuning; first identify a real cache-line contention issue with profiling.
