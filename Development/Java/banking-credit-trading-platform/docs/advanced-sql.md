# Advanced SQL Examples

Window function:
```sql
SELECT client_id, instrument_id, notional,
       SUM(notional) OVER (PARTITION BY client_id ORDER BY created_at) AS running_exposure
FROM orders;
```

CTE:
```sql
WITH rejected AS (
  SELECT client_id, COUNT(*) AS rejection_count
  FROM risk_decisions
  WHERE status = 'REJECTED'
  GROUP BY client_id
)
SELECT * FROM rejected ORDER BY rejection_count DESC;
```

Explain analyze:
```sql
EXPLAIN ANALYZE SELECT * FROM market_data_ticks
WHERE instrument_id = 'bond-apple-2029'
ORDER BY received_at DESC LIMIT 1;
```

Indexing: lifecycle queries should index client/status/time. Partitioning: high-volume tick and audit tables are candidates for time partitioning. Materialized views can accelerate regulatory reports when freshness requirements permit.
