# Generation Failure Runbook

## Signals

- Queue age exceeds 5 minutes.
- `PENDING` or `PROCESSING` jobs grow continuously.
- Provider transient failure rate exceeds 10%.
- Refund count does not match final failure count.
- Cleanup failures leave source photos after final job state.

## Triage

1. Check `/api/health/ready` for MySQL and RabbitMQ.
2. Inspect worker logs by `jobId`; never log image payloads, signed URLs, or object keys in shared channels.
3. Check RabbitMQ queue depth, dead-letter count, and oldest message age.
4. Check provider status and Ark API rate-limit responses.
5. Verify credit ledger for `generation:<clientKey>` and `refund:<jobId>` idempotency keys.

## Recovery

- Restart worker if leases are stale and queue connectivity is healthy.
- Re-run outbox recovery if unpublished outbox rows exist.
- For transient provider failures, allow retry policy to complete.
- For permanent failures, confirm `FAILED_REFUNDED` and exactly one refund ledger row.
- For cleanup failures, retry object deletion and metadata soft-delete.

## Escalation

Escalate before manually modifying ledger rows. Manual changes require recording user ID, job ID, reason, operator, and timestamp.
