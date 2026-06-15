CREATE TABLE risk_limits (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    daily_limit NUMERIC(18,2) NOT NULL,
    current_exposure NUMERIC(18,2) NOT NULL,
    restricted_instruments VARCHAR(1000) NOT NULL
);

CREATE TABLE risk_decisions (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    order_notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    reasons VARCHAR(2000),
    decided_at TIMESTAMP NOT NULL
);

INSERT INTO risk_limits (id, client_id, currency, daily_limit, current_exposure, restricted_instruments)
VALUES ('limit-client-alpha', 'client-alpha', 'USD', 5000000.00, 1000000.00, 'bond-restricted-1');
