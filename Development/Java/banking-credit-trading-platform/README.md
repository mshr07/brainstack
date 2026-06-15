# Banking Credit Trading Platform

This repository is a production-style educational simulation of credit trading workflows inside a bank. It is intentionally local and safe: it does not connect to real exchanges, real bank systems, real customer data, or live trading venues. Market data, FIX messages, RFQs, orders, risk checks, executions, audit events, and regulatory reports are simulated.

## Why This Project Is Valuable

The project gives you a realistic codebase to discuss Java, Spring Boot, distributed systems, and credit trading in interviews. It favors stable, runnable examples over fragile demos: Kafka, Redis, PostgreSQL, OpenTelemetry, ELK, Prometheus, Grafana, Kubernetes, JMeter, and Gatling are represented with code, config, and docs, while the services also run in a simple H2-backed local mode.

## Architecture

- `common-domain`: value objects, enums, pricing strategy, risk rules, events, order state machine, concurrency examples.
- `common-observability`: correlation ID filter, metric names, structured logging helper.
- `market-data-service`: instrument catalogue, tick ingestion, NIO mock feed reader, Kafka tick producer.
- `rfq-service`: RFQ lifecycle, quote generation, Redis/local active RFQ cache, JPA, transactions, outbox records, Kafka events.
- `oms-service`: order creation, idempotency keys, pre-trade risk, optimistic locking, execution simulation, Kafka events.
- `risk-service`: client limits, instrument restrictions, duplicate protection, kill switch, MiFID-style controls.
- `fix-gateway-simulator`: small FIX-like parser and message generator for NewOrderSingle, ExecutionReport, QuoteRequest, and Quote.
- `low-latency-lab`: ring buffer, virtual threads, NIO file journal, JMM visibility examples.
- `api-gateway`: JWT security, demo users, protected support and route APIs.
- `reporting-service`: audit search, risk rejection report, simulated MiFID II export, SQL view examples.

## Tech Stack

Java 21, Spring Boot, Spring MVC, Spring Data JPA, Hibernate, Spring Security, Maven, H2 local mode, PostgreSQL, Redis, Kafka, Flyway, Micrometer, Prometheus, Grafana, OpenTelemetry notes, ELK configs, Docker Compose, Kubernetes manifests, Jenkins, GitHub Actions, JUnit 5, Mockito-ready test setup, JMeter, and Gatling.

## Topic Coverage

| Topic | Where Used | Why It Matters In Banking | Interview Explanation |
|---|---|---|---|
| Advanced Core Java | `common-domain/.../CoreJavaExamples.java`, records, enums, generics | Trading systems need precise types and predictable behavior | Explain immutable records for value objects and explicit domain enums |
| Java Collections Framework | caches, repositories, ring buffer, maps, sets | Choosing the wrong collection can increase latency or contention | Compare `ConcurrentHashMap`, `List`, `Set`, and bounded queues |
| Multithreading & Concurrency | `CoreJavaExamples`, `low-latency-lab` | RFQ enrichment, audit publishing, and market data pipelines run concurrently | Discuss ExecutorService, CompletableFuture, BlockingQueue, AtomicLong |
| JVM Internals | `docs/java-performance.md` | GC pauses and allocation rate affect trading latency | Explain heap, stack, metaspace, JIT, and allocation pressure |
| Garbage Collection | `docs/java-performance.md` | Stop-the-world pauses can delay orders | Discuss G1/ZGC flags and measuring before tuning |
| Java Memory Model | `JmmVisibilityDemo.java` | Visibility bugs cause stale risk or order state | Explain volatile and happens-before |
| NIO | `NioMarketFeedReader.java`, `FileBackedEventJournal.java` | Feeds and journals often use non-blocking or buffered I/O | Explain ByteBuffer and FileChannel |
| Design Patterns | strategy pricing/risk, factory events, state OMS | Patterns keep domain behavior extensible | Map each pattern to a package |
| SOLID Principles | `docs/lld.md` and risk/pricing interfaces | New rules should not require editing every service | Explain open-closed via `RiskRule` |
| Spring Framework Core | beans, DI, filters, properties | DI keeps services testable and replaceable | Explain constructor injection |
| Spring Boot | all service modules | Local runnable services with auto-configuration | Explain profiles and Actuator |
| Spring Data JPA & Hibernate | service repositories/entities | Banking workflows need durable state and optimistic locking | Explain repositories and `@Version` |
| Spring Security | `api-gateway` | Role-based access protects trading/support APIs | Explain JWT filter and BCrypt users |
| REST API Design | controllers under `/api/v1` | Clear APIs reduce integration errors | Explain HTTP methods, DTOs, validation |
| Microservices Architecture | Maven modules per service | Separate scaling and ownership | Explain service boundaries |
| Distributed Systems Fundamentals | Kafka/outbox/docs | Failures are partial and asynchronous | Explain retries, idempotency, correlation IDs |
| Event-Driven Architecture | domain events and Kafka publishers | Trading workflows are naturally event streams | Explain RFQ accepted to order creation |
| Apache Kafka | producers/consumers/topics | Durable event backbone for workflows | Explain topic naming and consumer groups |
| FIX Protocol | `fix-gateway-simulator` | Common protocol for electronic trading | Explain tags 35, 11, 55, 54, 38, 44 |
| Electronic Trading Systems | OMS, RFQ, FIX, market data | Orders require state, routing, execution, audit | Explain lifecycle from RFQ to execution |
| RFQ Workflows | `rfq-service` | Credit trading often negotiates quotes | Explain created, quoted, accepted |
| Order Management Systems | `oms-service` | OMS tracks state and idempotency | Explain state machine and optimistic locking |
| Market Data Systems | `market-data-service` | Pricing depends on fresh ticks | Explain ingestion, snapshot, Kafka publish |
| Low Latency System Design | `low-latency-lab`, docs | Latency outliers matter in trading | Explain batching and avoiding allocation churn |
| JVM Performance Tuning | `docs/java-performance.md` | Latency and throughput depend on JVM behavior | Explain flags and profiling loop |
| Performance Profiling | docs and performance tests | Tune based on evidence | Explain JFR, async-profiler, metrics |
| Threading Models | `ThreadingModelDemo.java` | Workloads differ for CPU and I/O | Compare pools and virtual threads |
| High Throughput System Design | Kafka, queues, ring buffer | Throughput comes from batching and backpressure | Explain producer/consumer design |
| LMAX Disruptor | `docs/low-latency.md`, ring buffer abstraction | Single-writer ring buffers reduce coordination overhead | Explain concept without fragile dependency |
| Aeron Messaging | `docs/low-latency.md` | Ultra-low latency transport for specialized cases | Compare to Kafka |
| Chronicle Queue | `FileBackedEventJournal.java`, docs | Durable low-latency event journal concept | Explain file-backed append-only journal |
| Database Design | migrations in each service | Correct schema supports audit and workflows | Explain indexes and table ownership |
| Advanced SQL | `docs/advanced-sql.md` | Reports need windows, CTEs, partitions | Explain exposure aggregation query |
| PostgreSQL | Docker Compose and Flyway | Common durable service database | Explain local H2 vs Postgres |
| Oracle Database compatibility notes | `docs/oracle-compatibility.md` | Banks often run Oracle estates | Explain syntax and type differences |
| Transaction Management | `@Transactional`, outbox | Avoid partial state changes | Explain rollback and outbox pattern |
| Redis Caching | RFQ cache, docs | Hot state and idempotency keys need quick access | Explain cache fallback and invalidation |
| CI/CD Pipelines | `Jenkinsfile`, GitHub Actions | Repeatable builds reduce release risk | Explain test, static checks, image build |
| Maven | root reactor | Standard enterprise Java build | Explain modules and `-pl` |
| Gradle comparison notes | `docs/maven-vs-gradle.md` | Teams choose based on ecosystem and speed | Explain why Maven is primary here |
| Jenkins | `Jenkinsfile` | Common bank CI tool | Explain stages |
| Unit Testing | common-domain, FIX, JWT, ring buffer tests | Fast feedback for domain behavior | Explain pure unit tests |
| JUnit 5 | tests | Modern Java testing | Explain assertions and lifecycle |
| Mockito | dependency via Spring Boot Test | Useful for service isolation | Explain where mocks would fit |
| Integration Testing | docs/Testcontainers dependency notes | Validates DB/Kafka/Redis boundaries | Explain when to add container tests |
| Contract Testing | `contracts/rfq-created.yml` | Keeps producer/consumer schemas aligned | Explain contract as shared API |
| Performance Testing | `performance` folder | Measures latency and throughput | Explain baseline and regression |
| JMeter | `performance/jmeter` | Common API load test tool | Explain test plan target |
| Gatling | `performance/gatling` | Code-based load testing | Explain scenario |
| Docker | `docker-compose.yml`, Dockerfiles template notes | Local dependencies and packaging | Explain services |
| Kubernetes | `infra/k8s` | Production deployment pattern | Explain deployment/service/probes |
| Linux for Developers | `docs/production-support.md` | Support requires shell fluency | Explain curl, grep, journalctl, top |
| Prometheus | `infra/prometheus` | Metrics scraping | Explain actuator prometheus endpoint |
| Grafana | `infra/grafana` | Dashboarding | Explain business metrics |
| OpenTelemetry | `infra/otel`, docs | Distributed tracing | Explain trace and correlation ID |
| ELK Stack | `infra/elk` | Log aggregation and search | Explain structured logs |
| Production Support | runbooks | Incidents happen after deploy | Explain triage loop |
| Incident Management | `docs/incident-management.md` | Coordinated response lowers impact | Explain severity and communication |
| System Design HLD | `docs/hld.md` | Architecture communication | Explain data flow |
| Low-Level Design LLD | `docs/lld.md` | Class and state design | Explain RFQ, OMS, risk |
| Scalability Patterns | `docs/scalability-patterns.md` | Growth needs partitioning and caching | Explain horizontal scaling |
| Resilience Patterns | `docs/resilience-patterns.md` | Services fail independently | Explain retries, DLQ, circuit breaker |
| Regulatory Concepts such as MiFID II | reporting and docs | Trades need traceability | Explain simulated audit/reporting |
| Trading Risk Controls | `risk-service` | Prevent bad or excessive trades | Explain limits, duplicate check, kill switch |
| Financial Markets Basics | `docs/financial-markets-basics.md` | Domain context | Explain bond/yield/spread |
| Credit Trading Domain | `docs/credit-trading-domain.md` | RFQ and bonds are domain-specific | Explain buy/sell, notional, quote |
| Quantitative Systems Integration | pricing strategy/docs | Quants supply models into services | Explain simplified clean price and DV01 |

## Run Locally

```bash
mvn clean install
docker compose up -d
mvn spring-boot:run -pl api-gateway
mvn spring-boot:run -pl market-data-service
mvn spring-boot:run -pl rfq-service
mvn spring-boot:run -pl oms-service
mvn spring-boot:run -pl risk-service
mvn spring-boot:run -pl reporting-service
```

Simple local mode uses H2 defaults and can run with no Docker dependencies:

```bash
mvn spring-boot:run -pl api-gateway -Dspring-boot.run.profiles=local
```

## Demo Users

- `admin/password` with `ADMIN`
- `trader/password` with `TRADER`
- `risk/password` with `RISK_MANAGER`
- `support/password` with `SUPPORT`
- `readonly/password` with `READ_ONLY`

## Example API Requests

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"trader","password":"password"}'

curl http://localhost:8081/api/v1/instruments

curl -X POST http://localhost:8082/api/v1/rfqs \
  -H 'Content-Type: application/json' \
  -H 'X-Correlation-Id: demo-123' \
  -d '{"clientId":"client-alpha","instrumentId":"bond-apple-2029","side":"BUY","notional":1000000,"currency":"USD"}'

curl -X POST http://localhost:8084/api/v1/risk/check \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"client-alpha","instrumentId":"bond-apple-2029","orderNotional":1000000,"currency":"USD","idempotencyKey":"demo-1"}'
```

Swagger UI is available at `/swagger-ui.html` on each service. Prometheus metrics are available at `/actuator/prometheus`.

## Tests

```bash
mvn test
mvn clean test
```

## Interview Explanation Guide

Start with the business flow: client requests a quote for a bond, trader quotes, client accepts, OMS creates an order, risk checks run, execution is simulated, and audit/reporting captures the trail. Then map the flow to engineering concepts: REST for commands, Kafka for workflow events, JPA/Flyway for durable state, Redis for hot active RFQs, Spring Security for protected APIs, and observability for support.

## Future Improvements

- Add real Testcontainers integration tests for PostgreSQL, Kafka, and Redis.
- Add service-to-service routing in the gateway using Spring Cloud Gateway.
- Replace the simple JWT implementation with an enterprise identity provider integration.
- Add schema registry and Avro/Protobuf event schemas.
- Add a real pricing library boundary for quantitative analytics.
- Add Dockerfiles per service and full Helm charts.
