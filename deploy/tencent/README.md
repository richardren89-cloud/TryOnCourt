# Tencent Cloud Deployment

Target region: `ap-beijing`

The first China-only release runs Web and Worker as separate services built from the same container image.

## Required Resources

- VPC: private subnet for application, MySQL, RabbitMQ, and COS access.
- Container runtime: Tencent Cloud TKE Serverless or TCR + Cloud Run equivalent.
- MySQL: TencentDB for MySQL 8.0/8.4, private network only, automated daily backups, 7-day minimum retention.
- RabbitMQ: Tencent Cloud message queue/RabbitMQ-compatible broker, private network only.
- COS: private bucket, same region, server-side encryption enabled, public access blocked.
- Secrets: `DATABASE_URL`, `RABBITMQ_URL`, `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`, `ARK_API_KEY`.
- Domain/TLS: ICP-ready China domain with HTTPS termination before public launch.
- Logs: redact signed URLs, API keys, provider payloads, and image object keys.

## Service Split

- Web: `PROCESS_ROLE=web`, exposes port `3000`, probes `/api/health/live` and `/api/health/ready`.
- Worker: `PROCESS_ROLE=worker`, no public ingress, same image, subscribes to generation queue.

## Operational Alerts

- Queue age greater than 5 minutes.
- Pending generation job count greater than normal baseline.
- Provider transient failure rate over 10% for 10 minutes.
- Provider permanent/safety rejection spikes.
- Generation P95 duration greater than 90 seconds.
- Refund count diverges from final failure count.
- Cleanup failures or undeleted source photos older than retention policy.
- MySQL connection saturation or slow query growth.
- COS storage growth outside forecast.

## Release Notes

The Ark provider key must be rotated if it was ever shared outside the secret manager. Production prompts and UI must avoid unlicensed tournament marks; use generic court-style labels until licensing is complete.
