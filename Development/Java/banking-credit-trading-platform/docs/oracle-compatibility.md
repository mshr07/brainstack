# Oracle Compatibility Notes

PostgreSQL is the runnable database. Oracle compatibility work usually involves identity syntax, date arithmetic, pagination, JSON functions, boolean representation, and sequence handling.

Use standard SQL where possible. Keep migrations reviewed per database. Avoid relying on H2 behavior as proof of PostgreSQL or Oracle compatibility.
