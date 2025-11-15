# CRITICAL UNTESTED API ROUTES - IMMEDIATE ACTION REQUIRED

**Generated:** 2025-11-15  
**Priority:** URGENT - Security & Compliance Risk

---

## EXECUTIVE SUMMARY

Out of 113 API routes, 63 are untested (55.8%). Most concerning:

- **21 HIGH PRIORITY routes** - Authentication, billing, compliance (CRITICAL SECURITY GAPS)
- **11 MEDIUM PRIORITY routes** - Business logic, integrations
- **31 LOW PRIORITY routes** - Feature-specific functionality

## IMMEDIATE ACTION ITEMS

### Week 1-2: CRITICAL SECURITY & COMPLIANCE (21 routes, ~500 tests)

#### Authentication Routes (7 routes) - HIGHEST PRIORITY
**Security Risk: CRITICAL**

```
/app/api/auth/[...nextauth]/route.ts
  - Methods: GET, POST
  - Risk: Core authentication handler, potential for unauthorized access
  - Tests needed: ~25 tests (happy path, error cases, session management)

/app/api/auth/webauthn/authenticate/route.ts
  - Methods: POST
  - Risk: Passwordless auth bypass vulnerability
  - Tests needed: ~20 tests

/app/api/auth/webauthn/authenticate/options/route.ts
  - Methods: POST
  - Risk: Challenge manipulation
  - Tests needed: ~15 tests

/app/api/auth/webauthn/authenticate/verify/route.ts
  - Methods: POST
  - Risk: Signature verification bypass
  - Tests needed: ~20 tests

/app/api/auth/webauthn/register/route.ts
  - Methods: POST
  - Risk: Unauthorized key registration
  - Tests needed: ~20 tests

/app/api/auth/webauthn/register/options/route.ts
  - Methods: POST
  - Risk: Challenge generation weakness
  - Tests needed: ~15 tests

/app/api/auth/webauthn/register/verify/route.ts
  - Methods: POST
  - Risk: Registration verification bypass
  - Tests needed: ~20 tests
```

**Total for Auth: ~135 tests**

#### Billing Routes (4 routes) - FINANCIAL RISK
**Financial Risk: CRITICAL**

```
/app/api/billing/checkout/route.ts
  - Methods: POST
  - Risk: Unauthorized payment session creation, price manipulation
  - Tests needed: ~30 tests (Stripe integration, session validation, pricing)

/app/api/billing/webhook/route.ts
  - Methods: POST
  - Risk: Webhook spoofing, payment bypass, subscription manipulation
  - Tests needed: ~35 tests (signature verification, event handling, idempotency)

/app/api/billing/plans/route.ts
  - Methods: GET
  - Risk: Plan data manipulation, unauthorized access to pricing
  - Tests needed: ~15 tests

/app/api/internal/billing/[orgId]/credits/route.ts
  - Methods: GET
  - Risk: Credit balance manipulation, cross-org access
  - Tests needed: ~20 tests
```

**Total for Billing: ~100 tests**

#### Compliance Routes (5 routes) - LEGAL RISK
**Legal Risk: CRITICAL (GDPR/CCPA)**

```
/app/api/compliance/audit/route.ts
  - Methods: GET, POST
  - Risk: Audit trail tampering, compliance violations
  - Tests needed: ~25 tests

/app/api/compliance/audit/export/route.ts
  - Methods: GET
  - Risk: Unauthorized data export, GDPR compliance
  - Tests needed: ~20 tests

/app/api/compliance/consents/route.ts
  - Methods: GET, PATCH
  - Risk: Consent manipulation, legal compliance breach
  - Tests needed: ~20 tests

/app/api/compliance/forget/route.ts
  - Methods: GET, POST, PATCH
  - Risk: Right-to-be-forgotten violations, incomplete deletion
  - Tests needed: ~30 tests

/app/api/compliance/forget/[requestId]/complete/route.ts
  - Methods: POST
  - Risk: Incomplete data deletion, GDPR violations
  - Tests needed: ~25 tests
```

**Total for Compliance: ~120 tests**

#### Security & Admin Routes (5 routes)
**Security Risk: HIGH**

```
/app/api/developer/keys/route.ts
  - Methods: POST, GET
  - Risk: API key leakage, unauthorized access
  - Tests needed: ~30 tests (create, revoke, rotate, list)

/app/api/developer/webhooks/route.ts
  - Methods: POST, GET
  - Risk: Webhook manipulation, unauthorized callbacks
  - Tests needed: ~25 tests

/app/api/internal/security/keys/route.ts
  - Methods: GET
  - Risk: Security key exposure
  - Tests needed: ~15 tests

/app/api/admin/rbac/members/route.ts
  - Methods: GET, POST
  - Risk: Privilege escalation, unauthorized role assignment
  - Tests needed: ~30 tests

/app/api/admin/geo-policy/route.ts
  - Methods: GET, POST
  - Risk: Geo-restriction bypass
  - Tests needed: ~20 tests
```

**Total for Security/Admin: ~120 tests**

---

## TESTING REQUIREMENTS

For each untested route, tests MUST include:

### 1. Authentication & Authorization (30% of tests)
- [ ] Unauthenticated requests (401)
- [ ] Insufficient permissions (403)
- [ ] Cross-org/tenant access prevention
- [ ] Rate limiting
- [ ] Session validation

### 2. Input Validation (25% of tests)
- [ ] Missing required fields (400)
- [ ] Invalid field types (400)
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] Path traversal attempts
- [ ] Large payload handling

### 3. Business Logic (25% of tests)
- [ ] Happy path scenarios
- [ ] Edge cases (empty, null, boundary values)
- [ ] State transitions
- [ ] Idempotency (for POST/PATCH)
- [ ] Concurrent request handling

### 4. Error Handling (15% of tests)
- [ ] Database errors (500)
- [ ] External service failures (502, 503)
- [ ] Timeout scenarios
- [ ] Graceful degradation

### 5. Security Scenarios (5% of tests)
- [ ] CSRF protection
- [ ] CORS validation
- [ ] Content-Type validation
- [ ] Request signature verification (webhooks)

---

## RISK MATRIX

| Route Category | Routes | Tests Needed | Security Risk | Financial Risk | Legal Risk | Priority |
|---------------|--------|--------------|---------------|----------------|------------|----------|
| Authentication | 7 | ~135 | CRITICAL | - | - | 1 |
| Billing | 4 | ~100 | HIGH | CRITICAL | MEDIUM | 1 |
| Compliance | 5 | ~120 | MEDIUM | - | CRITICAL | 1 |
| Security/Admin | 5 | ~120 | CRITICAL | - | - | 1 |
| **TOTAL HIGH** | **21** | **~475** | - | - | - | - |

---

## RECOMMENDED IMPLEMENTATION ORDER

### Week 1
1. **Day 1-2:** Authentication routes (auth/[...nextauth], WebAuthn) - 135 tests
2. **Day 3-4:** Billing routes (checkout, webhook, plans) - 100 tests
3. **Day 5:** Review and refine

### Week 2
1. **Day 1-2:** Compliance routes (GDPR/audit) - 120 tests
2. **Day 3-4:** Security/Admin routes (API keys, RBAC, geo-policy) - 120 tests
3. **Day 5:** Integration testing and review

### Success Criteria
- [ ] All 21 high-priority routes have comprehensive tests
- [ ] 100% authorization test coverage
- [ ] 100% error handling coverage
- [ ] All financial transactions validated
- [ ] All GDPR requirements tested
- [ ] Security vulnerabilities identified and addressed

---

## EXAMPLE TEST STRUCTURE

Based on existing high-quality tests, here's the expected structure:

```typescript
describe('POST /api/billing/checkout', () => {
  // Authentication tests (401)
  it('returns 401 when not authenticated', async () => { ... })
  
  // Authorization tests (403)
  it('returns 403 when user lacks billing permissions', async () => { ... })
  
  // Input validation (400)
  it('returns 400 when planSlug is missing', async () => { ... })
  it('returns 400 when planSlug is invalid', async () => { ... })
  it('returns 400 when successUrl is malformed', async () => { ... })
  
  // Business logic (200/201)
  it('creates checkout session with valid inputs', async () => { ... })
  it('uses default plan when planSlug not provided', async () => { ... })
  it('includes promotion codes when enabled', async () => { ... })
  it('sets correct organization in client_reference_id', async () => { ... })
  
  // External service errors (500/502)
  it('handles Stripe API errors gracefully', async () => { ... })
  it('returns mock session when Stripe is not configured', async () => { ... })
  
  // Security tests
  it('prevents CSRF attacks', async () => { ... })
  it('validates Stripe signature', async () => { ... })
  it('rate limits checkout attempts', async () => { ... })
})
```

---

## DEPLOYMENT BLOCKER

**DO NOT DEPLOY TO PRODUCTION** until at least the following are tested:

1. All authentication routes (7 routes)
2. All billing routes (4 routes)
3. All compliance routes (5 routes)
4. API key management (2 routes)
5. RBAC routes (1 route)

**Total blockers: 19 routes, ~400 tests**

These routes handle:
- User authentication and session management
- Financial transactions (Stripe)
- Legal compliance (GDPR/CCPA)
- API security (keys, webhooks)
- Access control (RBAC)

Deploying without these tests exposes the platform to:
- Unauthorized access
- Payment fraud
- Legal liability
- Data breaches
- Privilege escalation attacks

---

## CONCLUSION

The absence of tests for authentication, billing, and compliance routes represents a **CRITICAL SECURITY AND LEGAL RISK**. These must be addressed immediately before any production deployment.

**Recommended Action:** Allocate dedicated resources for the next 2 weeks to implement the ~475 high-priority tests outlined above.

**Contact:** Development team should prioritize this over all feature work until completion.

