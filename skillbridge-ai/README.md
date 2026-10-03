# SkillBridge AI

A working interview and coding practice application built with **Next.js, TypeScript, React, and MongoDB**.

## Run locally

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [the live preview](http://127.0.0.1:3000). The development server updates the website automatically when source files change. Open this folder in VS Code; `.vscode/tasks.json` includes a development-server task.

## Pages

- `/`: overview, saved activity, practice statistics, and learning illustration.
- `/interviews`: role selection, optional two- or five-minute answer targets, fresh questions at each step, visible answer submission, feedback, hints, and saved three-question sessions.
- `/coding`: 500 runnable DSA exercises, search, difficulty filters, pagination, code editor, test results, next-unpracticed selection, and account-separated browser bookmarks, and automatic solution drafts (up to 30 recent problems).
- `/communication`: typed or spoken communication practice, spoken prompts, follow-ups, coach notes, and saved unscored sessions.
- `/applications`: stages, notes, follow-up reminders, search, account sync when MongoDB is configured, and reversible archiving.
- `/progress`: weekly goals and activity-based practice recommendations; history filters, score chart, milestones, streaks, CSV export, and saved question-by-question interview reviews with downloadable notes.
- `/resources`: illustrated guides for STAR answers, DSA techniques, and technical communication.
- `/subscription`: Free and ₹399 INR/month Pro plans, payment setup state, and renewal cancellation for active subscriptions.
- `/settings`: account details and connection status.
- `/resume`: guided resume builder, editable sections, completeness checklist, autosaved draft, classic academic serif preview, education-first order, responsibility and achievement sections, and clickable PDF links. The starting summary uses a local template; it is not AI-generated. Example content is explicitly loaded by the user. Export is Latin-script only, and unsupported characters produce a readable error.
- `/login` and `/register`: working password authentication with validation and readable errors.

## What works without external credentials

The preview starts without secrets. Interview questions combine authored role-specific topics with practical scenarios, avoid recent duplicates, and change at every step. Local feedback uses keyword coverage and answer detail; **it does not evaluate technical correctness** and is labeled accordingly.

Coding exercises run in a browser Web Worker, have a two-second timeout, and never execute candidate code on the application server. Communication uses guided local follow-ups; its sessions are unscored. Browser speech recognition and speech synthesis are optional: transcription depends on browser support and the user granting microphone access. Text input remains available.

Progress is cached in browser storage, separately for each signed-in account and guests. Development accounts and hashed sessions use an ignored `.data/accounts.json` file when MongoDB is absent. This is a single-process local development fallback, not a serverless production database.

## The 500-exercise catalog

The catalog contains **12 standalone starter challenges plus 61 authored algorithm families with eight explicitly labeled output variations each** (488 variations). It is not advertised as 500 unrelated algorithms. Every exercise has an original statement, example, starter function, and at least four runnable test cases.

40 variations have Hard difficulty, including N-Queens, edit distance, burst balloons, Hamiltonian paths, and palindrome partitioning. Families cover arrays, hash maps, sets, stacks, prefix sums, sliding windows, binary search, sorting, intervals, greedy algorithms, backtracking, dynamic programming, graph traversal, matrices, bits, and Euclid’s algorithm. Variations ask for full results, counts, boundary entries, ordered slices, reversed results, or deduplicated results. They reinforce the same underlying technique with distinct output contracts.

“Next unpracticed” excludes visited exercise IDs on the current browser and previous coding attempts in the loaded account history. Manual selection remains available for revision. Browser-only visit history is not synced across devices; saved attempts sync with MongoDB.

## Enable MongoDB

Add to `.env.local`:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_CONNECTION_STRING
MONGODB_DB=skillbridge
```

Restart the server. The app uses the official MongoDB Node driver, a reusable connection pool, per-user query scoping, unique email and result indexes, and expiring server-side sessions. Collections are `users`, `sessions`, and `practice`. A guest session remains scoped by an opaque browser cookie; it is not a verified account.

See [MongoDB connection documentation](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/).

## Enable AI coaching

Add your own provider credentials to `.env.local`; never put keys in client components or commit them:

```dotenv
AI_API_KEY=YOUR_API_KEY
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
```

Use a model supported by your account and capable of JSON output. Restart the server. AI requests are server-side, responses are validated, request rate limits apply, and provider errors keep the candidate’s answer intact. Pro accounts with an unexpired paid period receive AI-generated questions, contextual answer feedback, and AI conversation coaching. Free accounts retain local practice.

The API integration follows [Chat Completions](https://platform.openai.com/docs/api-reference/chat/create) and [structured output guidance](https://developers.openai.com/api/docs/guides/structured-outputs). No working AI key is bundled. AI scores are coaching feedback, not hiring decisions.

## Enable ₹399/month subscriptions

Use Razorpay **test credentials first** and configure MongoDB. Create a plan whose period is monthly, interval is 1, currency is INR, and amount is **39900 paise**. The backend verifies these exact values before creating a subscription.

```dotenv
RAZORPAY_KEY_ID=YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_PLAN_ID=YOUR_MONTHLY_PLAN_ID
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

Configure an HTTPS webhook at `/api/billing/webhook` for subscription events. Checkout creates recurring subscriptions, verifies signatures against the server-stored subscription ID, and fetches the latest provider state. Webhooks verify the raw request-body signature and fetch current state rather than trusting possibly stale events. Pro access requires an eligible paid period; checkout authorization alone does not grant it.

The application reuses pending checkouts and blocks duplicate subscriptions. Active members can cancel renewal at the end of the billing cycle. The subscription is capped at 120 monthly cycles. No live charges are made by the project setup or test suite. Razorpay and actual MongoDB integration cannot be validated without credentials and a reachable webhook.

See [Razorpay subscription API](https://github.com/razorpay/razorpay-node/blob/master/documents/subscription.md).

## Validation

```sh
npm run test
npm run typecheck
npm run build
# While the development server is running, in local fallback mode:
node scripts/check-api.mjs
```

The unit suite covers catalog integrity, projection contracts, independently checked edge cases, all 12 starter problem solutions, worker syntax errors and mutation rejection, password salting and verification, registration validation, billing signatures, and origin checks. The API script exercises registration, duplicate accounts, session revocation, login failures, fresh questions, answer feedback, cross-origin rejection, communication, invalid progress, and unconfigured billing states. It creates and removes its own isolated local test account.

Browser checks include three-step interview completion, code execution, infinite-loop termination, generated exercise execution, nonrepeating problem selection, communication replies and saving, navigation, and progress filters. Real AI output, MongoDB persistence, microphone capture, and real payments require separately configured services/user permission and are not represented as verified.

## Before public production deployment

Production requires MongoDB and refuses local account storage. Shared MongoDB request counters and checkout leases support multiple application instances. The Pro AI allowance is 300 requests per UTC calendar month by default (`AI_MONTHLY_REQUEST_LIMIT`). Configure MongoDB and a proper secret environment. The local file store is not suitable for multiple server instances. Add email verification and account recovery, replace the local worker with a dedicated isolated execution service if handling adversarial submissions. Browser workers prevent UI freezes but are **not a hostile-code security sandbox**. Scores and credits are not authoritative exam results.

See [LAUNCH.md](../LAUNCH.md) for deployment checks, the remaining account recovery work, and how to validate costs before accepting real payments.

New interview sessions preserve submitted questions, answers, and feedback in progress records. Older sessions retain their original summary and are marked as lacking detailed answers. Solution drafts remain on the current browser; they are not synced to MongoDB. Resetting a solution clears that problem’s saved draft after confirmation.

### Role preparation tools
- `/stories`: guided STAR story library with competency tags, search, editing, and account-scoped browser storage (up to 50 stories). No cloud sync for stories.
- `/job-fit`: compare pasted job descriptions against your resume draft or pasted experience using a bounded skill dictionary. Browser processing; keyword coverage only, not an ATS or hiring score.
- `/interviews`: choose technical or behavioral interviews. Behavioral prompts cover teamwork, conflict, failure, ownership, prioritization, feedback, leadership, and adaptability; existing transcript review and feedback work with both.

Mock interviews support Foundation/Standard/Advanced question depth, pause/resume, word counts and browser recovery of unfinished sessions. Recovery is per account and starts paused. See DEPLOYMENT.md for hosting and domain setup.

Resume builder includes up to 10 named snapshots and validated JSON backup/import. Coding practice includes browser-saved complexity and reasoning notes per problem. Interview feedback includes answer revision and re-review; only the final answer/feedback are stored in the session transcript. Additional AI reviews consume the advertised request allowance.
