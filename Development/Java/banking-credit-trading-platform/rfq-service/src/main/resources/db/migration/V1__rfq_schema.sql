CREATE TABLE rfqs (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    side VARCHAR(10) NOT NULL,
    notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE quotes (
    id VARCHAR(64) PRIMARY KEY,
    rfq_id VARCHAR(64) NOT NULL,
    trader_id VARCHAR(80) NOT NULL,
    quote_price NUMERIC(18,6) NOT NULL,
    spread_bps NUMERIC(10,4) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    aggregate_id VARCHAR(64) NOT NULL,
    topic VARCHAR(120) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP
);

CREATE INDEX idx_rfqs_client_status ON rfqs(client_id, status);

INSERT INTO rfqs (id, client_id, instrument_id, side, notional, currency, status, created_at, updated_at)
VALUES ('rfq-demo-1', 'client-alpha', 'bond-apple-2029', 'BUY', 1000000.00, 'USD', 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
