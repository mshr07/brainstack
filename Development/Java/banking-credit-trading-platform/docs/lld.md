# Low-Level Design

RFQ lifecycle classes live in rfq-service. `RfqEntity` stores lifecycle state, `QuoteEntity` stores trader quote details, and `RfqService` coordinates transaction boundaries, cache updates, outbox writes, and Kafka publishing.

OMS uses the State pattern through `OrderLifecycleStateMachine`. Valid transitions are explicit: NEW to VALIDATED, VALIDATED to ACCEPTED or RISK_REJECTED, ACCEPTED to ROUTED, and ROUTED to EXECUTED.

Risk controls use the Strategy pattern. Each `RiskRule` evaluates one reason to reject. `CompositeRiskEngine` applies the rules without hard-coding individual checks into controllers.

Pricing uses `PricingStrategy` and `CleanPricePricingStrategy`. The formula is intentionally simplified and documented as an approximation, not production quant pricing.

Events use a Factory through `DomainEventFactory`. Persistence uses the Repository pattern through Spring Data JPA repositories. FIX parsing is an Adapter-style boundary that converts tag strings into typed accessors.
