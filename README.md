# AbodeAI Web Application

AbodeAI is an enterprise-grade AI web application that unifies task orchestration, generative design, photoreal rendering, and manufacturing handoff. The interface is built on Next.js 14 with Tailwind and translates the PRD into production-ready sections.

## Experience Overview

- Landing layout served by `components/abode/page-shell.tsx`, wiring hero, workspaces, capabilities, automation, observability, compliance, integrations, pricing, architecture, roadmap, and contact elements.
- Authenticated orchestration dashboard at `/dashboard` (see `app/dashboard/page.tsx`) backed by role-based access control. Users with write permission can draft pipelines, review status, and generate audit events.
- SWR-powered data fetching (`hooks/use-platform-snapshot.ts`, `hooks/use-sustainability-summary.ts`, `hooks/use-billing-summary.ts`) that calls FastAPI/Redis/Stripe services through `lib/services/platform.ts`, with fixtures in `lib/abode-data.ts` for offline development.
- socket.io telemetry via `hooks/use-realtime-telemetry.ts` streams sustainability and incident events into the observability dashboard.
- Stripe usage data rendered in `components/abode/billing-overview.tsx`, reflecting credit balances, rollover amounts, and compliance alerts.
- RBAC utilities in `lib/rbac.ts` plus an audit feed (`lib/audit-log.ts`) that capture pipeline mutations from the new APIs under `app/api/orchestration/*`.

## Integration & Types

- Domain contracts live in `lib/platform-types.ts` (RBAC, workspaces, agents, sustainability metrics, billing ledger, telemetry events).
- `lib/http-client.ts` centralises fetch logic, attaching bearer tokens from `lib/auth-token.ts` when `auth: true` is requested.
- Fallback dataset in `lib/abode-data.ts` exports `fallbackPlatformSnapshot`, `fallbackSustainabilitySummary`, and `fallbackBillingSummary` so the UI still renders without live services.

## Environment Variables

Create a `.env.local` with endpoints, auth configuration, and developer toggles:

```
NEXT_PUBLIC_PLATFORM_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_METRICS_API_BASE_URL=https://metrics.example.com
NEXT_PUBLIC_BILLING_API_BASE_URL=https://billing.example.com
NEXT_PUBLIC_SOCKET_URL=wss://events.example.com
NEXT_PUBLIC_AUTH_TOKEN_KEY=abodeai_access_token
NEXT_PUBLIC_STRIPE_PORTAL_URL=https://billing.stripe.com/p/session
BACKEND_URL=https://chat.example.com
API_KEY=service-token

# NextAuth / Auth0
NEXTAUTH_SECRET=replace-with-random-string
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_CLIENT_ID=client-id
AUTH0_CLIENT_SECRET=client-secret
AUTH0_ROLE_CLAIM=https://abode.ai/roles
AUTH0_ORG_CLAIM=https://abode.ai/orgId

# Developer override (optional local login)
DEV_AUTH_ENABLED=true
DEV_AUTH_ROLES=admin,analyst
DEV_AUTH_ORG_ID=aurora-collective

# Platform token service (used by lib/auth-session.ts)
NEXT_PUBLIC_CLIENT_ID=dev-client
NEXT_PUBLIC_CLIENT_SECRET=dev-secret
NEXT_PUBLIC_ORG_ID=aurora-collective
```

> Missing API URLs surface friendly errors and automatically fall back to the static fixtures. With `DEV_AUTH_ENABLED=true` you can sign in using the credential provider from the `/auth/sign-in` screen without hitting Auth0.

## Commands

```bash
npm install
npm run dev              # start Next.js dev server
npm run mock:server       # optional mock FastAPI/Stripe/telemetry services
npm run lint             # ESLint (see .eslintrc.json)
npm test                 # Jest + Testing Library sample suite
npm run cy:run           # Cypress headless run (requires dev server)
```

- ESLint config lives in `.eslintrc.json` (Next core web vitals + TypeScript rules).
- Jest is configured through `jest.config.ts` with helpers in `jest.setup.ts` and sample specs in `__tests__/hero.test.tsx` and `__tests__/rbac.test.ts`.
- Cypress is configured in `cypress.config.ts` with a smoke test under `cypress/e2e/smoke.cy.ts`.

## Next Steps

1. Connect the auth token helper (`lib/auth-token.ts`) to your identity provider (Auth0/Entra) and gate workspace views accordingly.
2. Replace the fallback fixtures with live FastAPI responses for workspaces, projects, sustainability, and billing.
3. Expand Cypress coverage for hybrid approval flows, Stripe top-ups, and collaborative editing.
4. Add accessibility and localisation audits (axe-core, jest-axe, next-intl) to meet WCAG 2.2 AA.
5. Wire Firebase service workers and push notifications to complete the PWA roadmap described in the PRD.

For Coohom/AIHouse assets (80M+ model library, CodeCarbon dashboards, etc.), replace the corresponding sections in `lib/abode-data.ts` with live integrations.
