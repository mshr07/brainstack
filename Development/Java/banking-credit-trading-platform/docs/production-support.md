# Production Support Runbook

Useful commands:

```bash
curl -s http://localhost:8082/actuator/health
curl -s http://localhost:8082/actuator/metrics
docker compose ps
docker compose logs -f kafka
ps aux | grep java
jcmd <pid> VM.flags
jcmd <pid> JFR.start name=banking settings=profile duration=60s filename=banking.jfr
grep 'correlationId=demo-123' app.log
```

Common incidents: Kafka consumer lag, database slow query, Redis unavailable, high GC pause, order stuck pending, stale market data, risk service unavailable. Triage by impact, recent change, health checks, logs, metrics, dependencies, and mitigation.
