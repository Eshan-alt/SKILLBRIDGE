# SkillBridge paid launch checklist

The app is a working product foundation. Revenue and capacity have not been demonstrated through paying customers or a production load test.

## Architecture shipped

- Next.js routes and stateless application instances backed by MongoDB. Production refuses to store accounts in local files.
- Bounded connection pools (20 connections per instance), query indexes, hashed sessions, and account-scoped reads and writes.
- MongoDB atomic request counters with TTL cleanup, shared across instances. Per-minute limits use fixed buckets; boundary bursts are possible.
- Pro AI requests share a calendar-month allowance (300 by default). All reserved requests, including provider failures, count. The subscription page discloses this. Set the allowance before accepting payments; monitor provider cost and avoid changing advertised allowances without communicating the change.
- Server-side paid entitlement checks, signature verification, provider-state reconciliation, and account checkout leases. This is not a transactional guarantee across MongoDB and Razorpay: verify reconciliation and webhook retries in the provider's test environment.
- Application tracker with browser fallback, indexed account sync, newer-edit conflict handling, and recoverable archives. The current account view loads the newest 500 records. Weekly goals and DSA bookmarks are browser-local preferences.
- Resume drafts stay in the browser. Export runs on the application server and does not call an AI provider.

## Before accepting real payments

1. Deploy with HTTPS and MongoDB; use the `.env.example` keys as a configuration checklist. Keep all secret values in the hosting provider's secret manager.
2. Configure Razorpay in test mode and exercise checkout, failed payment, renewal, cancellation, expired entitlement, duplicate webhook, and delayed webhook cases. Switch to live keys only after these pass.
3. Implement and verify email ownership and password recovery before public signup. These flows are not implemented yet; current authentication is suitable for a controlled pilot.
4. Publish your own terms, privacy policy, refund/cancellation policy, support contact, and data deletion process. The app has no automatic compliance or tax implementation.
5. Configure database backups, monitoring, provider spending alerts, and logs that exclude answers, resume contents, passwords, and secrets. Test restoring a backup.
6. Load-test concurrent authentication, question generation, and result writes using representative database data. Tune pool sizes and request limits to the deployment's instance count. No user-count capacity claim is made yet.
7. Replace browser-only code execution with a dedicated isolated runner before accepting adversarial exam-style submissions. Practice scores are not authoritative examination results.
8. Validate the landing page, keyboard navigation, mobile layout, and microphone behavior on the browsers you intend to support.

## Measure the business

Start with an invited pilot. Track activation (first completed session), return visits, Free-to-Pro conversion, cancellations, support issues, and actual AI cost per paid user. Compare the ₹399 gross subscription price with payment fees, infrastructure, provider usage, taxes, and refunds before deciding that the plan is profitable. Do not promise jobs or guaranteed interview outcomes.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build` in `skillbridge-ai`. In local development fallback mode with the preview running, run `node scripts/check-api.mjs`. MongoDB, AI, and payment live integration require separate credentials and are not covered by the local checks.
