# Test Coverage Summary Table

## Quick Reference: All API Routes and Test Status

### Legend
- ✓ = Tested
- ⚠ = Partial Coverage
- ✗ = Not Tested
- [method] = HTTP methods tested

---

## Complete Route Listing with Coverage

### Accessibility (1/1 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| audit | ✓ | POST, GET | ✓ | ✓ | ✓ | ✗ |

### Account (1/1 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| devices | ✓ | GET, POST | ✓ | ✓ | ✓ | ⚠ |

### Admin (0/2 - 0%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| geo-policy | ✗ | N/A | N/A | N/A | N/A | N/A |
| rbac/members | ✗ | N/A | N/A | N/A | N/A | N/A |

### Analytics (3/3 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| dashboards | ✓ | GET, POST, PUT, DELETE | ✓ | ✓ | ✓ | ⚠ |
| reports | ✓ | GET, POST | ✓ | ✓ | ✓ | ⚠ |
| overview | ✓ | GET | ✓ | ✓ | ✓ | ⚠ |

### Auth (3/7 - 43%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| webauthn/register | ✓ | POST | ✓ | ✓ | ✓ | ✗ |
| webauthn/register/options | ✓ | POST | ✓ | ✓ | ✓ | ✗ |
| webauthn/register/verify | ✓ | POST | ✓ | ✓ | ✓ | ✗ |
| [...nextauth] | ✗ | N/A | N/A | N/A | N/A | N/A |
| webauthn/authenticate | ✗ | N/A | N/A | N/A | N/A | N/A |
| webauthn/authenticate/options | ✗ | N/A | N/A | N/A | N/A | N/A |
| webauthn/authenticate/verify | ✗ | N/A | N/A | N/A | N/A | N/A |

### Billing (0/3 - 0%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| checkout | ✗ | POST | CRITICAL | Stripe integration, payment flow |
| plans | ✗ | GET | HIGH | Plan listing, pricing |
| webhook | ✗ | POST | CRITICAL | Payment confirmation, fraud |

### Blockchain (4/4 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| contracts/deploy | ✓ | POST | ✓ | ✓ | ✓ | ⚠ |
| materials | ✓ | GET, POST | ✓ | ✓ | ✓ | ⚠ |
| materials/register | ✓ | POST | ✓ | ✓ | ✓ | ✗ |
| materials/[id]/history | ✓ | GET | ✓ | ✓ | ✓ | ✗ |

### Collaboration (3/3 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| comments | ✓ | GET, POST, PUT, DELETE | ✓ | ✓ | ✓ | ✓ |
| permissions | ✓ | GET, POST, PUT, DELETE | ✓ | ✓ | ✓ | ⚠ |
| versions | ✓ | GET, POST | ✓ | ✓ | ✓ | ⚠ |

### Compliance (2/5 - 40%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| audit | ✓ | GET, POST | LOW | Compliance auditing |
| audit/export | ✓ | GET | LOW | Report export |
| consents | ✗ | GET, PATCH | CRITICAL | GDPR consent tracking |
| forget | ✗ | POST | CRITICAL | Right-to-be-forgotten |
| forget/[requestId]/complete | ✗ | POST | CRITICAL | Data deletion confirmation |

### Developers (0/2 - 0%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| keys | ✗ | GET, POST, DELETE | HIGH | API key management |
| webhooks | ✗ | GET, POST, PUT, DELETE | MEDIUM | Webhook configuration |

### Manufacturing (0/5 - 0%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| boms | ✗ | GET, POST | HIGH | Bill of Materials |
| boms/[bomId] | ✗ | GET, PUT, DELETE | HIGH | BOM details |
| boms/[bomId]/exports/cut | ✗ | GET | MEDIUM | CUT format export |
| boms/[bomId]/exports/dxf | ✗ | GET | MEDIUM | DXF format export |
| boms/[bomId]/sustainability | ✗ | GET | MEDIUM | Sustainability data |

### Models (4/4 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| [id] | ✓ | GET, PUT, DELETE | ✓ | ✓ | ✓ | ⚠ |
| download/[id] | ✓ | GET | ✓ | ✓ | ✓ | ⚠ |
| search | ✓ | GET | ✓ | ✓ | ✓ | ✗ |
| upload | ✓ | POST | ✓ | ✓ | ✓ | ✗ |

### Orchestration (3/7 - 43%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| dag-runs/sync | ✓ | POST | LOW | DAG sync |
| pipelines/[id]/status | ✓ | GET | LOW | Status checking |
| pipelines/[id]/tasks/[taskId] | ✓ | GET, POST | LOW | Task management |
| dag-runs | ✗ | GET, POST | HIGH | DAG execution |
| dag-runs/[runId] | ✗ | GET, PUT, DELETE | HIGH | Run management |
| dag-runs/[runId]/tasks/[taskId] | ✗ | GET, POST | HIGH | Task execution |
| pipelines | ✗ | GET, POST | HIGH | Pipeline creation |

### Projects (3/3 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| [projectId]/files/upload | ✓ | POST | ✓ | ✓ | ✓ | ✗ |
| [projectId]/geojson | ✓ | GET, POST | ✓ | ✓ | ✓ | ⚠ |
| [projectId]/parse | ✓ | POST | ✓ | ✓ | ✓ | ✗ |

### Render (4/4 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| blender | ✓ | POST, GET | ✓ | ✓ | ✓ | ⚠ |
| queue | ✓ | GET | ✓ | ✓ | ✓ | ✗ |
| status/[jobId] | ✓ | GET | ✓ | ✓ | ✓ | ✗ |
| cancel/[jobId] | ✓ | POST | ✓ | ✓ | ✓ | ✗ |

### Studio (1/6 - 17%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| scene/history | ✓ | GET | LOW | History retrieval |
| assets | ✗ | GET, POST | HIGH | Asset management |
| generate | ✗ | POST | CRITICAL | AI generation |
| generate/[jobId] | ✗ | GET | CRITICAL | Job status |
| scene | ✗ | GET, POST, PUT, DELETE | CRITICAL | Scene CRUD |
| sustainability | ✗ | POST | MEDIUM | Sustainability calc |

### Tenants (3/3 - 100%)
| Route | Status | Methods | Auth | Validation | Error | Auth Check |
|-------|--------|---------|------|-----------|-------|-----------|
| | ✓ | GET, POST, PUT, DELETE | ✓ | ✓ | ✓ | ✓ |
| [tenantId]/branding | ✓ | GET, POST, PUT | ✓ | ✓ | ✓ | ✓ |
| [tenantId]/users | ✓ | GET, POST, PUT, DELETE | ✓ | ✓ | ✓ | ✓ |

### Versioning (0/3 - 0%)
| Route | Status | Methods | Risk | Impact |
|-------|--------|---------|------|--------|
| branches | ✗ | GET, POST | HIGH | Branch management |
| branches/[branchId]/commits | ✗ | GET | MEDIUM | Commit history |
| pull-requests | ✗ | GET, POST, PUT | MEDIUM | PR management |

---

## Coverage Statistics

### By Category
```
High Coverage (80%+):
  Accessibility    100% (1/1)
  Account          100% (1/1)
  AI-Lighting      100% (2/2)
  Analytics        100% (3/3)
  ARVR             100% (1/1)
  Audit            100% (1/1)
  BIM              100% (2/2)
  Bionic           100% (1/1)
  Blockchain       100% (4/4)
  CFD              100% (1/1)
  Collaboration    100% (3/3)
  Cost-Estimation  100% (2/2)
  Digital-Twin     100% (2/2)
  Discourse        100% (1/1)
  Edge             100% (1/1)
  IOT              100% (2/2)
  Maps             100% (2/2)
  MLOPS            100% (3/3)
  Mobile           100% (2/2)
  Models           100% (4/4)
  Partners         100% (1/1)
  Permits          100% (3/3)
  Projects         100% (3/3)
  Reasoning        100% (1/1)
  Render           100% (4/4)
  Risk             100% (1/1)
  Simulation       100% (1/1)
  Tenants          100% (3/3)
  Tracing          100% (1/1)
  Video            100% (2/2)

Medium Coverage (50-79%):
  Auth             43% (3/7)
  Compliance       40% (2/5)
  Orchestration    43% (3/7)

Low Coverage (0-49%):
  Admin              0% (0/2)
  Airflow            0% (0/1)
  Billing            0% (0/3)
  Credits            0% (0/2)
  Developer          0% (0/2)
  Governance         0% (0/2)
  Integrations       0% (0/2)
  Internal           0% (0/2)
  Manufacturing      0% (0/5)
  Marketplace        0% (0/1)
  Referrals          0% (0/1)
  Studio            17% (1/6)
  Sustainability     0% (0/1)
  Versioning         0% (0/3)
```

### By Scenario Type
```
Scenario        Coverage  Status
Auth Testing      92%      ✓ GOOD
Validation        100%     ✓ EXCELLENT
Error Handling    100%     ✓ EXCELLENT
404 Not Found      75%     ⚠ ACCEPTABLE
Authorization      33%     ✗ CRITICAL GAP

HTTP Methods:
GET               70%      ⚠ MEDIUM
POST              90%      ✓ GOOD
PUT               50%      ⚠ WEAK
DELETE            60%      ⚠ WEAK
PATCH             10%      ✗ CRITICAL GAP
```

---

## Priority Action Items

### CRITICAL (Do First)
- [ ] Add billing/checkout tests (Stripe integration)
- [ ] Add billing/webhook tests (payment confirmation)
- [ ] Add compliance/consents tests (GDPR)
- [ ] Add compliance/forget tests (GDPR)
- [ ] Add authorization tests to all 8 routes missing them
- [ ] Add studio/generate & studio/scene tests (primary features)

### HIGH PRIORITY
- [ ] Add PATCH method testing (currently 10% coverage)
- [ ] Add manufacturing/boms tests (5 routes)
- [ ] Add orchestration/dag-runs tests (4 routes)
- [ ] Add versioning tests (3 routes)
- [ ] Improve PUT/DELETE coverage from 50-60% to 100%

### MEDIUM PRIORITY
- [ ] Add rate limiting tests
- [ ] Add integration tests for external services
- [ ] Add concurrency/race condition tests
- [ ] Add admin/developer routes (4 routes)
- [ ] Improve GET coverage from 70% to 100%

