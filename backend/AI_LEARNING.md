# AI Learning

The student route is `/ai-learning`. It uses the existing application shell, themes, authentication and shared navigation. Sessions are stored on the current device, isolated by profile ID (up to 20 sessions / 60 messages each). Raw attachments are sent for the current request only and are not persisted. Follow-ups use the last 20 messages. Research mode organizes knowledge and suggests sources to verify; it does not perform live web search.

## Enable real responses

The included Supabase Edge Function uses Gemini and verifies signed Clerk session JWTs. Never put the Gemini API key in a `VITE_` variable. From the `backend` directory:

1. Set Supabase function secrets: `GEMINI_API_KEY`, `GEMINI_MODEL` (a Gemini model supporting PDF input and structured JSON responses), `CLERK_ISSUER_URL` (your Clerk instance issuer), and `AI_ALLOWED_ORIGINS` (comma-separated exact app origins, such as `http://localhost:5173,https://your-app.example`). Set these through the Supabase dashboard or CLI secrets command.
2. Deploy with `supabase functions deploy ai-learning`. The checked-in function configuration disables Supabase's JWT gateway check because this app uses Clerk; the function itself verifies the signature, issuer, expiration, subject, and authorized party. Do not remove that verification.
3. Sign in as a student and open AI Learning. No database migration is required for this feature.

The browser defaults to `${VITE_SUPABASE_URL}/functions/v1/ai-learning`. Optional `VITE_AI_LEARNING_ENDPOINT` can point to another trusted backend implementing the same contract. It receives the student's Clerk bearer token, so only configure an endpoint you control.

POST multipart fields: `mode`, `messages` (JSON array of user/assistant role + content), and optional `file` (PDF/TXT/Markdown, max 5 MB). Return `{ text, quiz: [{ question, options, answer, explanation }], flashcards: [{ question, answer }] }`. Quiz answers are zero-based indexes. The client validates replies before rendering them. Error responses use `{ error: string }` with a non-2xx status.

The endpoint limits request size, conversation length and output tokens, and applies a best-effort 10 requests/minute per-user limit within each function instance. Set provider spending limits and gateway/global quotas before a public launch; the in-memory limiter is not a distributed quota.

## Validation

`npm run build`, `npm run lint`, and `npm run test:learning`, and `npm run test:learning:ui` (uses installed Microsoft Edge). Browser tests render the actual page with test-only auth mocks and a controlled AI endpoint; these mocks are not part of the production route.

Live generation requires deployed function secrets. Validate: PDF summarization, follow-up context, quiz answers and adaptive next level, flashcard reveal/navigation, cancellation/retry, and reopening sessions after reload. Check 320px, 768px, and 1440px in both app themes.

