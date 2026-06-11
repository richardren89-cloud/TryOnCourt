# Privacy Deletion Runbook

## Scope

This runbook covers user asset deletion and full account closure.

## User Asset Deletion

1. Confirm the asset belongs to the authenticated user.
2. Delete the private COS object.
3. Soft-delete `GeneratedAsset.deletedAt`.
4. Verify `/api/assets/[id]` returns 404 for that user after deletion.

## Account Closure

1. Require confirmation phrase `DELETE`.
2. Verify the recent password.
3. Revoke active sessions.
4. Delete uploaded photos and generated assets from COS.
5. Soft-delete uploaded/generated metadata.
6. Anonymize username as `deleted-<userId>`.
7. Preserve ledger and consent records only as legally necessary audit records.

## Partial Failure Recovery

- If object deletion fails, do not mark the request as completed.
- Retry storage deletion with the same object keys.
- Do not expose deleted or pending-deletion assets through signed URLs.

## Evidence

Record request timestamp, operator if manual, object counts, and final verification result. Do not record private image URLs or signed download URLs.
