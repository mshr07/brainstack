CREATE TABLE audit_events (
    id VARCHAR(64) PRIMARY KEY,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    actor VARCHAR(120) NOT NULL,
    details VARCHAR(2000) NOT NULL,
    occurred_at TIMESTAMP NOT NULL
);

CREATE TABLE incident_records (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE VIEW rfq_lifecycle_report AS
SELECT aggregate_id, event_type, actor, occurred_at
FROM audit_events
WHERE event_type LIKE 'rfq.%';

INSERT INTO audit_events (id, aggregate_id, event_type, actor, details, occurred_at)
VALUES
('audit-1', 'rfq-demo-1', 'rfq.created', 'trader', 'demo rfq created', CURRENT_TIMESTAMP),
('audit-2', 'order-demo-1', 'order.executed', 'oms', 'demo order executed', CURRENT_TIMESTAMP);

INSERT INTO incident_records (id, title, severity, status, created_at)
VALUES ('incident-demo-1', 'Kafka consumer lag elevated', 'P2', 'OPEN', CURRENT_TIMESTAMP);
