# AI Tennis Try-On MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a production-usable China-only MVP where users browse ten professional tennis outfits, register, receive five credits, upload two photos, and spend one credit to generate a four-panel tennis try-on image through a replaceable domestic image provider.

**Architecture:** Use one Next.js App Router application for pages and business APIs, plus a separate TypeScript worker process from the same repository. MySQL is the source of truth, RabbitMQ carries generation job IDs, COS stores private image objects, and provider/storage/queue interfaces keep local tests independent from Tencent Cloud.

**Tech Stack:** Node.js 24 LTS, Next.js 16.2.x, React 19, TypeScript, Prisma ORM 7 with MySQL 8, RabbitMQ via `amqplib`, Tencent COS SDK, Zod, `@node-rs/argon2`, Vitest 4, Testing Library, Playwright, Docker Compose, Tencent Cloud container hosting/MySQL/RabbitMQ/COS.

---

## File Structure

```text
app/
  (public)/page.tsx
  (public)/outfits/page.tsx
  (public)/outfits/[slug]/page.tsx
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (account)/try-on/[outfitId]/page.tsx
  (account)/history/page.tsx
  (account)/credits/page.tsx
  (account)/settings/page.tsx
  api/auth/{register,login,logout}/route.ts
  api/uploads/{sign,complete}/route.ts
  api/generations/route.ts
  api/generations/[id]/route.ts
  api/assets/[id]/route.ts
  api/account/route.ts
components/
  layout/ site-header.tsx
  outfits/ outfit-card.tsx outfit-detail.tsx
  try-on/ photo-uploader.tsx generation-form.tsx generation-status.tsx
  account/ credit-balance.tsx delete-account-form.tsx
lib/
  auth/ password.ts session.ts require-user.ts
  catalog/ repository.ts types.ts
  credits/ service.ts
  generations/ service.ts state-machine.ts prompt.ts
  queue/ types.ts rabbitmq.ts in-memory.ts
  storage/ types.ts cos.ts local.ts
  image-provider/ types.ts mock.ts selected-provider.ts
  uploads/ validation.ts cleanup.ts
  db.ts env.ts errors.ts
prisma/schema.prisma
prisma/seed.ts
worker/index.ts worker/process-generation.ts worker/recover-outbox.ts
tests/unit/ tests/integration/ tests/e2e/
public/demo-outfits/
Dockerfile docker-compose.yml .env.example
```

## Task 1: Bootstrap the Application and Quality Gates

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/(public)/page.tsx`
- Create: `.gitignore`, `.env.example`, `Dockerfile`, `docker-compose.yml`
- Test: `tests/unit/smoke.test.ts`

- [ ] **Step 1: Scaffold Next.js without overwriting the approved docs**

Run:

```bash
npx create-next-app@16.2.9 . --ts --eslint --app --src-dir=false --use-npm --no-tailwind --import-alias='@/*'
```

Expected: Next.js files are created; `docs/` and `.git/` remain intact.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
npm install @prisma/client zod @node-rs/argon2 amqplib cos-nodejs-sdk-v5
npm install -D prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test tsx
```

Expected: `package-lock.json` is updated with no install errors.

- [ ] **Step 3: Add deterministic scripts**

Set `package.json` scripts to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "worker": "tsx worker/index.ts",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "db:migrate": "prisma migrate dev",
  "db:seed": "prisma db seed"
}
```

- [ ] **Step 4: Write and run the smoke test**

```ts
import { describe, expect, it } from "vitest";

describe("project", () => {
  it("runs tests", () => expect(true).toBe(true));
});
```

Run: `npm test`

Expected: one passing test.

- [ ] **Step 5: Add local infrastructure and container build**

`docker-compose.yml` must define MySQL 8.4 and RabbitMQ management images with health checks. `Dockerfile` must build Next.js standalone output and accept `PROCESS_ROLE=web|worker` at runtime.

Run: `docker compose config && npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app next.config.ts tsconfig.json vitest.config.ts playwright.config.ts Dockerfile docker-compose.yml .gitignore .env.example tests
git commit -m "chore: bootstrap tennis try-on application"
```

## Task 2: Define the Database and Seed Ten Outfit Placeholders

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma.config.ts`
- Create: `lib/db.ts`, `lib/catalog/types.ts`, `lib/catalog/repository.ts`
- Test: `tests/integration/catalog-repository.test.ts`

- [ ] **Step 1: Write a failing repository test**

```ts
it("returns published player-inspired outfits in display order", async () => {
  const outfits = await repository.listPublished();
  expect(outfits).toHaveLength(10);
  expect(outfits.every((item) => item.type === "PLAYER_INSPIRED")).toBe(true);
});
```

Run: `npm test -- tests/integration/catalog-repository.test.ts`

Expected: FAIL because the repository and schema do not exist.

- [ ] **Step 2: Define explicit Prisma models**

Create enums `OutfitType`, `Tour`, `PhotoKind`, `GenerationStatus`, `LedgerType`, and models `User`, `ConsentRecord`, `Session`, `Player`, `RankingSnapshot`, `Collection`, `Outfit`, `OutfitItem`, `SourceReference`, `CreditLedgerEntry`, `UploadedPhoto`, `GenerationJob`, `GeneratedAsset`, and `QueueOutbox`.

The key invariants must be encoded:

```prisma
model CreditLedgerEntry {
  id          String     @id @default(cuid())
  userId      String
  type        LedgerType
  amount      Int
  businessKey String     @unique
  createdAt   DateTime   @default(now())
  user        User       @relation(fields: [userId], references: [id])
}

model GenerationJob {
  id             String           @id @default(cuid())
  userId         String
  outfitId       String
  status         GenerationStatus @default(PENDING)
  saveSource     Boolean          @default(false)
  attemptCount   Int              @default(0)
  failureCode    String?
  leaseExpiresAt DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  @@index([userId, createdAt])
  @@index([status, leaseExpiresAt])
}
```

- [ ] **Step 3: Seed ten auditable placeholders**

Seed five ATP and five WTA records with stable slugs, `published=false`, and explicit fields for `rankingVerifiedAt`, `season`, and source URLs. Do not invent current player names or product models during implementation; content becomes publishable only after the later research task verifies them.

- [ ] **Step 4: Migrate and run the test**

Run:

```bash
docker compose up -d mysql
npx prisma migrate dev --name init
npm run db:seed
npm test -- tests/integration/catalog-repository.test.ts
```

Expected: migration succeeds; test passes after its fixture publishes ten test outfits.

- [ ] **Step 5: Commit**

```bash
git add prisma lib/db.ts lib/catalog tests/integration/catalog-repository.test.ts
git commit -m "feat: add catalog and generation data model"
```

## Task 3: Implement Registration, Login, Sessions, and Consent

**Files:**
- Create: `lib/auth/password.ts`, `lib/auth/session.ts`, `lib/auth/require-user.ts`
- Create: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- Create: `app/(auth)/register/page.tsx`, `app/(auth)/login/page.tsx`
- Test: `tests/unit/password.test.ts`, `tests/integration/auth.test.ts`

- [ ] **Step 1: Write failing password and registration tests**

```ts
it("hashes and verifies without storing the password", async () => {
  const hash = await hashPassword("Correct-Horse-123");
  expect(hash).not.toContain("Correct-Horse-123");
  await expect(verifyPassword(hash, "Correct-Horse-123")).resolves.toBe(true);
});

it("creates one consent record and one signup credit event", async () => {
  const response = await register(validMinorPayload);
  expect(response.status).toBe(201);
  expect(await ledgerCount("signup:" + response.userId)).toBe(1);
});
```

- [ ] **Step 2: Implement auth primitives**

Use Argon2id for password hashes. Generate 32-byte random session tokens, store only `sha256(token)` in MySQL, and set the raw token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.

```ts
export const SESSION_COOKIE = "courtfit_session";
export function digestSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 3: Implement registration as one transaction**

Validate username, password, age confirmation, guardian consent for ages 13-17, and terms version with Zod. In one Prisma transaction create `User`, `ConsentRecord`, and ledger entry `{ amount: 5, type: SIGNUP_BONUS, businessKey: signup:<userId> }`.

- [ ] **Step 4: Implement login/logout pages and APIs**

Return generic invalid-credential errors. Add a database-backed login attempt limiter keyed by username and IP hash, or a documented in-memory limiter only for local development plus cloud gateway rate limiting in production.

- [ ] **Step 5: Run verification**

Run: `npm test -- tests/unit/password.test.ts tests/integration/auth.test.ts && npm run typecheck`

Expected: all auth tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/auth app/api/auth app/'(auth)' tests/unit/password.test.ts tests/integration/auth.test.ts
git commit -m "feat: add username authentication and consent"
```

## Task 4: Build the Public Homepage and Outfit Catalog

**Files:**
- Create: `components/layout/site-header.tsx`, `components/outfits/outfit-card.tsx`, `components/outfits/outfit-detail.tsx`
- Modify: `app/(public)/page.tsx`, `app/globals.css`
- Create: `app/(public)/outfits/page.tsx`, `app/(public)/outfits/[slug]/page.tsx`
- Test: `tests/unit/outfit-card.test.tsx`, `tests/e2e/public-catalog.spec.ts`

- [ ] **Step 1: Write failing component and route tests**

```tsx
it("labels player outfits and links to details", () => {
  render(<OutfitCard outfit={fixture} />);
  expect(screen.getByText("ATP TOP 5")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看穿搭" })).toHaveAttribute("href", "/outfits/player-a-2026");
});
```

- [ ] **Step 2: Implement a mobile-first visual system**

Use CSS custom properties and focused components. Preserve the approved information hierarchy: hero, three-step explanation, featured outfits, ATP/WTA filters, full item list, source references, and try-on CTA.

- [ ] **Step 3: Add future own-brand compatibility without exposing fake products**

`OutfitCard` renders from `OutfitSummary` and branches only on `type` for labels. Do not create an active own-brand tab until real content exists; show a small “自有品牌精选，后期开放” teaser on the homepage.

- [ ] **Step 4: Verify responsive behavior**

Run: `npm test -- tests/unit/outfit-card.test.tsx && npm run test:e2e -- tests/e2e/public-catalog.spec.ts`

Expected: catalog is usable at 390x844 and 1440x900 viewports.

- [ ] **Step 5: Commit**

```bash
git add app components tests/unit/outfit-card.test.tsx tests/e2e/public-catalog.spec.ts
git commit -m "feat: add public outfit showcase"
```

## Task 5: Implement the Credit Ledger

**Files:**
- Create: `lib/credits/service.ts`
- Create: `app/(account)/credits/page.tsx`, `components/account/credit-balance.tsx`
- Test: `tests/integration/credits.test.ts`

- [ ] **Step 1: Write concurrency and idempotency tests**

```ts
it("allows only one of two concurrent spends at balance one", async () => {
  const results = await Promise.allSettled([
    spendCredit(userId, "generation:a"),
    spendCredit(userId, "generation:b"),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(await getBalance(userId)).toBe(0);
});

it("refunds a business key once", async () => {
  await refundCredit(userId, "refund:job-1");
  await refundCredit(userId, "refund:job-1");
  expect(await getBalance(userId)).toBe(1);
});
```

- [ ] **Step 2: Implement ledger-only balance calculations**

Do not maintain a separately mutable balance column. Sum ledger amounts inside the transaction that creates a spend, use a per-user database advisory lock or `SELECT ... FOR UPDATE` on the user row, and rely on unique `businessKey` values for idempotency.

- [ ] **Step 3: Build the credit page and insufficient-credit result**

Expose balance and paginated ledger entries. The generation service returns a typed `INSUFFICIENT_CREDITS` error consumed by the upgrade modal.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- tests/integration/credits.test.ts`

```bash
git add lib/credits app/'(account)'/credits components/account/credit-balance.tsx tests/integration/credits.test.ts
git commit -m "feat: add idempotent credit ledger"
```

## Task 6: Add Private Upload Storage and Validation

**Files:**
- Create: `lib/storage/types.ts`, `lib/storage/local.ts`, `lib/storage/cos.ts`
- Create: `lib/uploads/validation.ts`, `app/api/uploads/sign/route.ts`, `app/api/uploads/complete/route.ts`
- Create: `components/try-on/photo-uploader.tsx`
- Test: `tests/unit/upload-validation.test.ts`, `tests/integration/uploads.test.ts`

- [ ] **Step 1: Define and test the storage contract**

```ts
export interface PrivateObjectStore {
  createUpload(input: { key: string; contentType: string; maxBytes: number }): Promise<SignedUpload>;
  createDownload(key: string, expiresSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

Tests must reject non-JPEG/PNG/WebP files, oversized files, spoofed MIME headers, and uploads not owned by the current user.

- [ ] **Step 2: Implement local and COS adapters**

The local adapter writes only under a configured development directory. The COS adapter uses a private bucket, server-generated object keys, short expiration, and no public ACL.

- [ ] **Step 3: Implement the two-photo uploader**

Require exactly one `FULL_BODY` and one `HEADSHOT`. Record completed uploads only after checking object metadata. Keep advanced face/body checks behind a `PhotoQualityChecker` interface so the first implementation can provide basic dimensions and format validation.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- tests/unit/upload-validation.test.ts tests/integration/uploads.test.ts`

```bash
git add lib/storage lib/uploads app/api/uploads components/try-on/photo-uploader.tsx tests
git commit -m "feat: add private two-photo uploads"
```

## Task 7: Create Generation Jobs Atomically and Publish Through an Outbox

**Files:**
- Create: `lib/generations/service.ts`, `lib/generations/state-machine.ts`
- Create: `lib/queue/types.ts`, `lib/queue/in-memory.ts`, `lib/queue/rabbitmq.ts`
- Create: `app/api/generations/route.ts`, `worker/recover-outbox.ts`
- Test: `tests/integration/create-generation.test.ts`, `tests/unit/state-machine.test.ts`

- [ ] **Step 1: Write failing transaction tests**

Test that creating a job in one transaction writes: one `-1` ledger entry, one `PENDING` job, and one unpublished outbox row. Repeat the same idempotency key and verify no duplicate spend or job.

- [ ] **Step 2: Implement allowed state transitions**

```ts
const allowed = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SUCCEEDED", "PENDING", "FAILED_REFUNDED"],
  SUCCEEDED: [],
  FAILED_REFUNDED: [],
} as const;
```

- [ ] **Step 3: Implement create-generation transaction**

Validate ownership of both photos, selected outfit publication, and consent. Use request header `Idempotency-Key`; store it as the job client key and ledger business key.

- [ ] **Step 4: Implement reliable outbox publication**

After commit, attempt RabbitMQ publish. `worker/recover-outbox.ts` republishes unpublished rows with publisher confirms and marks them published only after broker confirmation. Queue messages contain only `{ jobId }`.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/integration/create-generation.test.ts tests/unit/state-machine.test.ts`

```bash
git add lib/generations lib/queue app/api/generations worker/recover-outbox.ts tests
git commit -m "feat: create generation jobs with reliable outbox"
```

## Task 8: Implement the Image Provider Boundary and Prompt Builder

**Files:**
- Create: `lib/image-provider/types.ts`, `lib/image-provider/mock.ts`, `lib/image-provider/selected-provider.ts`
- Create: `lib/generations/prompt.ts`
- Test: `tests/unit/prompt.test.ts`, `tests/contract/image-provider.contract.test.ts`

- [ ] **Step 1: Define provider-neutral types**

```ts
export interface ImageProvider {
  generate(input: TryOnRequest): Promise<{ providerJobId?: string; image: Uint8Array; mimeType: "image/png" | "image/jpeg" }>;
}

export type ProviderFailure =
  | { kind: "TRANSIENT"; code: string }
  | { kind: "PERMANENT"; code: string }
  | { kind: "SAFETY_REJECTED"; code: string };
```

- [ ] **Step 2: Test deterministic prompt construction**

The builder must include identity consistency, exact outfit items, four court styles, four distinct tennis actions, photorealistic sports photography, four-panel layout, and prohibited logo handling. It must not include usernames, object keys, or internal IDs.

- [ ] **Step 3: Implement a mock provider for full local workflows**

The mock returns a checked-in four-panel fixture and can be configured to emit transient, permanent, or safety errors. `selected-provider.ts` initially selects the mock by environment variable; the real domestic adapter is added only after Task 13 evaluation.

- [ ] **Step 4: Run contract tests and commit**

Run: `npm test -- tests/unit/prompt.test.ts tests/contract/image-provider.contract.test.ts`

```bash
git add lib/image-provider lib/generations/prompt.ts tests/unit/prompt.test.ts tests/contract
git commit -m "feat: add replaceable image provider boundary"
```

## Task 9: Build the Worker, Retry Policy, Refund, and Cleanup

**Files:**
- Create: `worker/index.ts`, `worker/process-generation.ts`
- Create: `lib/uploads/cleanup.ts`
- Test: `tests/integration/worker-success.test.ts`, `tests/integration/worker-failure.test.ts`

- [ ] **Step 1: Write success and failure tests**

Success must create one generated asset, mark the job `SUCCEEDED`, and delete source photos when `saveSource=false`. Permanent failure must mark `FAILED_REFUNDED`, create one `+1` refund, and clean source photos. Transient failure below the limit must return the job to `PENDING` without refund.

- [ ] **Step 2: Implement job leasing**

Atomically claim only `PENDING` jobs and set `PROCESSING`, `leaseExpiresAt`, and increment `attemptCount`. Reject duplicate deliveries while a valid lease exists; recover expired leases.

- [ ] **Step 3: Implement processing and retry policy**

Use at most three attempts with broker delay/dead-letter support or delayed republish. Retry only `TRANSIENT`. Treat invalid input and safety rejection as permanent user-visible failure codes.

- [ ] **Step 4: Implement idempotent finalization**

Store generated bytes first under a job-scoped key, then transactionally create `GeneratedAsset` and set `SUCCEEDED`. Refund with `businessKey=refund:<jobId>`. Cleanup is repeatable and treats missing objects as success.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/integration/worker-success.test.ts tests/integration/worker-failure.test.ts`

```bash
git add worker lib/uploads/cleanup.ts tests/integration/worker-*.test.ts
git commit -m "feat: process generation jobs safely"
```

## Task 10: Build Try-On, Status, History, and Upgrade UX

**Files:**
- Create: `components/try-on/generation-form.tsx`, `components/try-on/generation-status.tsx`
- Create: `app/(account)/try-on/[outfitId]/page.tsx`, `app/(account)/history/page.tsx`
- Create: `app/api/generations/[id]/route.ts`, `app/(account)/credits/upgrade/page.tsx`
- Test: `tests/unit/generation-form.test.tsx`, `tests/e2e/generation-flow.spec.ts`

- [ ] **Step 1: Write the end-to-end happy path using the mock provider**

The test registers a user, verifies balance 5, chooses an outfit, uploads two fixtures, leaves save-source off, generates, waits for `SUCCEEDED`, verifies balance 4, and opens the four-panel result.

- [ ] **Step 2: Implement generation form behavior**

Disable submission until both uploads complete. Show selected outfit, credit cost, balance, save-source toggle defaulted off, consent reminder, and a single submit button. Generate a fresh UUID idempotency key per intentional submission.

- [ ] **Step 3: Implement status and history**

Poll the authenticated status endpoint with bounded backoff. Render `PENDING`, `PROCESSING`, `SUCCEEDED`, and `FAILED_REFUNDED` using user-safe messages. History is paginated and only returns the current user's jobs.

- [ ] **Step 4: Implement insufficient-credit modal and upgrade placeholder**

The modal must not imply payment is active. Link to a page that says online upgrade is not yet available.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/unit/generation-form.test.tsx && npm run test:e2e -- tests/e2e/generation-flow.spec.ts`

```bash
git add app components/try-on tests/unit/generation-form.test.tsx tests/e2e/generation-flow.spec.ts
git commit -m "feat: add complete try-on generation experience"
```

## Task 11: Add Asset Deletion, Account Closure, and Security Controls

**Files:**
- Create: `app/api/assets/[id]/route.ts`, `app/api/account/route.ts`
- Create: `app/(account)/settings/page.tsx`, `components/account/delete-account-form.tsx`
- Create: `lib/security/rate-limit.ts`, `lib/security/content-safety.ts`
- Test: `tests/integration/deletion.test.ts`, `tests/integration/account-closure.test.ts`, `tests/e2e/settings.spec.ts`

- [ ] **Step 1: Write authorization and deletion tests**

Verify users cannot fetch or delete another user's assets. Deletion removes the COS object and marks metadata deleted. Account closure revokes sessions, deletes images, anonymizes the username, and preserves only legally necessary ledger/audit rows.

- [ ] **Step 2: Implement signed asset delivery**

`GET /api/assets/[id]` checks ownership and redirects to a short-lived signed COS URL. Never expose permanent object URLs.

- [ ] **Step 3: Implement deletion and account closure**

Use a confirmation phrase and recent-password verification for account closure. Make the cleanup process resumable with a deletion status so partial storage failures can be retried.

- [ ] **Step 4: Add baseline security headers and request limits**

Configure CSP, frame denial, MIME sniffing protection, upload size limits, auth/generation rate limits, and redacted structured logs. Do not log model payloads or signed URLs.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/integration/deletion.test.ts tests/integration/account-closure.test.ts && npm run test:e2e -- tests/e2e/settings.spec.ts`

```bash
git add app/api/assets app/api/account app/'(account)'/settings components/account lib/security tests
git commit -m "feat: add privacy controls and account closure"
```

## Task 12: Research and Publish the Ten Auditable Outfit Records

**Files:**
- Modify: `prisma/seed.ts`
- Create: `docs/content/2026-season-outfit-sources.md`
- Create: `public/demo-outfits/<outfit-slug>/...`
- Test: `tests/integration/catalog-content.test.ts`

- [ ] **Step 1: Capture a dated ranking snapshot from official ATP and WTA sources**

Record the exact retrieval date, top five names, rank, tour, and source URL. Do not rely on search snippets or undated secondary lists.

- [ ] **Step 2: Research one recent-season outfit per player**

For every item, record event/date, brand, exact model when verifiable, source URL, image license/permission status, and uncertainty. If an exact model cannot be verified, do not publish it as exact; replace the outfit or mark the item as unverified and keep the outfit unpublished.

- [ ] **Step 3: Add only authorized flat-lay assets**

Use brand press assets with permitted use, licensed supplier assets, or original flat-lay images. Do not copy the attached watermarked social-media composites into the product.

- [ ] **Step 4: Enforce content completeness**

```ts
it("publishes exactly ten sourced outfits", async () => {
  const outfits = await repository.listPublished();
  expect(outfits).toHaveLength(10);
  for (const outfit of outfits) {
    expect(outfit.rankingVerifiedAt).toBeTruthy();
    expect(outfit.sources.length).toBeGreaterThan(0);
    expect(outfit.items.every((item) => item.brand && item.modelName)).toBe(true);
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts docs/content public/demo-outfits tests/integration/catalog-content.test.ts
git commit -m "content: add sourced top-ten player outfits"
```

## Task 13: Evaluate Domestic Image Providers and Add the Selected Adapter

**Files:**
- Create: `evals/image-provider/cases.json`, `evals/image-provider/run.ts`, `evals/image-provider/scorecard.md`
- Create: `lib/image-provider/<selected-provider>.ts`
- Modify: `lib/image-provider/selected-provider.ts`, `.env.example`
- Test: `tests/contract/selected-provider.test.ts`

- [ ] **Step 1: Build an authorized 30-run evaluation set**

Use consenting adults or properly documented guardian consent for minors. Cover different body types, skin tones, genders, outfit colors, and both ATP/WTA clothing silhouettes. Keep evaluation images private and outside Git.

- [ ] **Step 2: Run each candidate through the same adapter input**

Record identity consistency 30%, outfit fidelity 30%, four-panel stability 15%, compliance/data residency 15%, and cost/P95 latency/failure rate 10%.

- [ ] **Step 3: Select only a provider that passes hard gates**

Require no critical identity or safety failure, documented mainland service terms, acceptable data handling, and satisfactory identity/outfit scores. Save aggregate scores and decision rationale, not private test images.

- [ ] **Step 4: Implement the selected adapter and contract tests**

Map provider authentication, request format, polling if required, output download, timeout, rate-limit, safety, and permanent errors into `ImageProvider` and `ProviderFailure`. Keep all provider-specific code in one file plus focused helpers.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/contract/selected-provider.test.ts && npm run typecheck`

```bash
git add evals/image-provider lib/image-provider .env.example tests/contract/selected-provider.test.ts
git commit -m "feat: integrate evaluated domestic image provider"
```

## Task 14: Production Deployment, Observability, and Release Verification

**Files:**
- Create: `.github/workflows/ci.yml` or the selected China-accessible CI equivalent
- Create: `deploy/tencent/README.md`, `deploy/tencent/web.yaml`, `deploy/tencent/worker.yaml`
- Create: `app/api/health/live/route.ts`, `app/api/health/ready/route.ts`
- Create: `docs/runbooks/generation-failures.md`, `docs/runbooks/privacy-deletion.md`, `docs/release-checklist.md`
- Test: `tests/integration/health.test.ts`

- [ ] **Step 1: Add health and readiness checks**

Liveness checks process health only. Readiness checks MySQL and RabbitMQ connectivity but does not call the paid image provider.

- [ ] **Step 2: Add CI gates**

CI runs `npm ci`, Prisma generation, lint, typecheck, unit/integration tests, production build, and Playwright smoke tests. No deployment occurs if a gate fails.

- [ ] **Step 3: Define Tencent Cloud resources**

Document exact region, private network, container service, MySQL 8, RabbitMQ, private COS bucket, secrets, least-privilege roles, TLS/domain, backups, retention, and log redaction. Keep Web and Worker as separate deployments built from the same image.

- [ ] **Step 4: Configure operational signals**

Alert on queue age, pending job count, provider failure rate, P95 duration, refund anomalies, cleanup failures, database connections, and disk/storage growth. Add correlation IDs using job IDs without logging personal image data.

- [ ] **Step 5: Run the complete release suite**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: every command exits 0. Then execute `docs/release-checklist.md` in the Tencent Cloud test environment, including real upload, generation, failure/refund, deletion, account closure, backup restore check, and mobile browser check.

- [ ] **Step 6: Complete legal and publication gates**

Before public launch, record ICP status and review outcomes for privacy, minors, generative AI obligations, player names, trademarks, tournament visual identity, and product images. If official tournament marks are not licensed, production prompts and UI must use generic court-style labels.

- [ ] **Step 7: Commit**

```bash
git add .github deploy app/api/health docs/runbooks docs/release-checklist.md tests/integration/health.test.ts
git commit -m "ops: add Tencent Cloud release pipeline"
```

## Final Acceptance

- [ ] A new user can register once and receives exactly five credits.
- [ ] Ten verified, sourced, authorized player outfits are publicly browsable.
- [ ] A user can upload exactly two private photos and choose whether to retain them.
- [ ] One generation consumes exactly one credit and produces one four-panel result.
- [ ] Duplicate requests and queue deliveries cannot double-charge or double-refund.
- [ ] Final failures refund exactly one credit and show a safe error message.
- [ ] Unretained source photos are deleted after success or final failure.
- [ ] Users can delete assets and close their account.
- [ ] The selected domestic provider passes the documented evaluation.
- [ ] All automated checks pass and Tencent Cloud alerts/runbooks are verified.
- [ ] ICP and required legal/content reviews are complete before public access.
