# Terraform boundary

Phase 9 will implement versioned modules for network, EKS, S3 lake, Glue/Athena/
Lake Formation, Aurora PostgreSQL, ElastiCache, IAM/IRSA, Secrets Manager, queues
and observability. Local development has no dependency on these modules. Plans
require security and cost review; state is remote/encrypted and never committed.
