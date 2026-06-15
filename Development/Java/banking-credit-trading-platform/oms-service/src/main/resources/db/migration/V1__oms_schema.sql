CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    rfq_id VARCHAR(64) NOT NULL,
    quote_id VARCHAR(64),
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    side VARCHAR(10) NOT NULL,
    notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL
);

CREATE TABLE executions (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    executed_price NUMERIC(18,6) NOT NULL,
    executed_quantity NUMERIC(18,2) NOT NULL,
    venue VARCHAR(80) NOT NULL,
    executed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_orders_client_status ON orders(client_id, status);
INSERT INTO orders (id, rfq_id, quote_id, client_id, instrument_id, side, notional, currency, status, idempotency_key, created_at, updated_at, version)
VALUES ('order-demo-1', 'rfq-demo-1', 'quote-demo-1', 'client-alpha', 'bond-apple-2029', 'BUY', 1000000.00, 'USD', 'EXECUTED', 'demo-key-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);
