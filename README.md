# Sam Rogers AI Resume
Interactive resume for https://sam-rogers.com/. The site presents a concise work history, an AI chat for recruiter questions, and a job-description fit assessment.
## Stack
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel Edge Functions
- Anthropic Messages API
- Optional Upstash Redis rate limiting
## Local Setup
```sh
npm install
cp .env.example .env.local
npm run dev
```
The Vite dev server runs on port 8080 by default. Use `vercel dev` when testing `/api/chat` or `/api/analyze-fit` locally.
## Environment
Required:
```sh
ANTHROPIC_API_KEY=
```
Optional rate limiting:
```sh
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Without Upstash, the API routes still run but skip rate limiting.
## Scripts
- `npm run dev`: start local Vite server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check, including Vercel API handlers
- `npm run test`: Vitest test suite
## Deployment
This repo is configured for Vercel. `vercel.json` rewrites API routes to `/api/:path*` and all other routes to the SPA entrypoint.
## Privacy Note
The fit assessment sends pasted job descriptions to the configured AI provider for analysis. The app does not intentionally store submitted job descriptions. For confidential roles, email Sam directly instead.
