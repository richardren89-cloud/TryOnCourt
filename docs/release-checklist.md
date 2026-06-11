# Release Checklist

## Automated Gates

- [ ] `npm ci`
- [ ] `DATABASE_URL=mysql://prisma:prisma@localhost:3306/prisma npx prisma generate`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run build:worker`
- [ ] `npm run test:e2e`

## Tencent Cloud Test Environment

- [ ] Web health live returns 200.
- [ ] Web readiness returns 200 with MySQL and RabbitMQ healthy.
- [ ] Worker starts with no public ingress.
- [ ] New user registration grants exactly 5 credits.
- [ ] Ten player-inspired outfits are browsable.
- [ ] Upload signs and completes two private photos.
- [ ] One generation consumes exactly one credit.
- [ ] Successful generation produces one four-panel result.
- [ ] Duplicate generation request does not double-charge.
- [ ] Final provider failure refunds exactly one credit.
- [ ] Unretained source photos are deleted after final state.
- [ ] User can delete a generated asset.
- [ ] User can close account and sessions are revoked.
- [ ] Backup restore drill completed.
- [ ] Mobile browser smoke test completed.

## Legal And Publication Gates

- [ ] ICP status recorded.
- [ ] Privacy policy and minor/guardian consent reviewed.
- [ ] Generative AI obligations reviewed.
- [ ] Player names, trademarks, and product image usage reviewed.
- [ ] Tournament marks removed or licensed.
- [ ] Ark API key rotated after any non-secret-manager exposure.
- [ ] Provider 30-run scorecard signed off.
