# Deploy SkillBridge AI

This source release builds for hosting. It has not been deployed to a public domain. Do not describe it as ready for unrestricted paid launch until the remaining checks below pass.

## Vercel

1. Import `Eshan-alt/SKILLBRIDGE` from GitHub and set **Root Directory** to `skillbridge-ai`. Use Next.js, `npm ci`, and `npm run build`.
2. Configure production environment variables from `.env.example`. **MONGODB_URI is mandatory in production**; local accounts are development-only. Use a separate production database, least-privilege database credentials, and provider-appropriate network access.
3. Set `APP_URL` to the intended HTTPS domain. Keep actual secret values in the hosting environment, never in Git or an archive.
4. Deploy a preview first. Test signup, signin, logout, saved practice and account isolation against the real database.
5. In the project’s Domains settings, add your domain. Apply the DNS records Vercel displays at your registrar and wait for domain and certificate verification. Do not guess DNS record values.
6. Configure Razorpay webhook URL as `https://YOUR_DOMAIN/api/billing/webhook` and the matching webhook secret. Verify that the plan is monthly INR 399 (39900 paise). Test checkout, failed payment, renewal, cancellation, duplicate/delayed webhooks and expiration using test credentials before live keys.

Official hosting instructions: https://vercel.com/docs/domains/working-with-domains/add-a-domain

## Configuration check

With environment values set, run `node scripts/preflight.mjs`. For a local configuration file, Node 24 supports `node --env-file=.env.local scripts/preflight.mjs`. Empty example values deliberately fail production checks. Presence checks do not contact providers or prove connectivity.

## Docker / Node hosting

From this app folder, run `docker build -t skillbridge .`, then `docker run --env-file .env.production -p 3000:3000 skillbridge`. Create `.env.production` locally and keep it private. Place the container behind an HTTPS reverse proxy; do not expose database or API secrets in image build arguments. The runtime uses an unprivileged user and the Next.js standalone build. Docker is not available in the current workspace, so this image was not executed here.

Alternatively run `npm ci`, `npm run build`, and `npm start` behind HTTPS. Configure your hosting process to restart on failure and monitor uptime, latency, provider errors, AI spend and database usage.

Next.js deployment reference: https://nextjs.org/docs/app/getting-started/deploying

## Required launch work

- Real MongoDB, AI and payment integration tests; database backup and restore test; realistic concurrency/load test.
- Email verification and password recovery are not implemented. Use an invited pilot until they exist and are verified.
- Owner-approved privacy, terms, cancellation/refund policies, support contact and data deletion process; these cannot be supplied truthfully without business details.
- Resume drafts, interview recovery, STAR stories, coding drafts and preferences use account-scoped browser storage. They do not sync across devices. Practice results and application records sync only when MongoDB is configured.
- Browser coding execution is a practice tool, not a secure examination service. Scores do not establish hiring suitability.
- Browser microphone/speech support varies; test on target devices and permissions. No audio-provider integration is claimed.

Run `npm test`, `npm run build` and the local-development API suite `node scripts/check-api.mjs`. That API suite intentionally expects local development storage; do not run it against production or a real customer database. See QA-REPORT.md and ../LAUNCH.md for test coverage and remaining checks.
