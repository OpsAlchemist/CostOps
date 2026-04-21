# Improvements & Known Issues

Current project status, known limitations, and areas for improvement.

---

## Current Project Status

CostOps AI is a functional MVP with:
- ✅ Multi-cloud cost calculation (AWS, Azure, GCP) with AI-powered pricing
- ✅ User authentication (JWT) and registration
- ✅ Login accepts username or email, with loading state and error handling
- ✅ Client-side SHA-256 password hashing before transmission
- ✅ Cloud credential storage (Fernet encrypted)
- ✅ Admin user management portal (list, onboard, delete users)
- ✅ Admin auto-assignment via `ADMIN_EMAILS` set on signup
- ✅ Settings page accessible to all users (not admin-only)
- ✅ Dynamic profile initials in dashboard header
- ✅ Logo links to `/overview`
- ✅ Dashboard with stats, optimization recommendations, reporting
- ✅ Dark/light theme
- ✅ Three deployment targets (Vercel, Docker, ECS)
- ✅ CI/CD pipeline with tests
- ✅ CloudWatch logging

---

## Known Issues

### Backend

1. **Mock dashboard data** — `/api/stats`, `/api/recommendations`, and `/api/history` return hardcoded mock data. These should query actual cost calculation history and generate real insights.

2. **No rate limiting** — Public endpoints (`/login`, `/signup`, `/estimate`, `/calculate-cost`) have no rate limiting, making them vulnerable to brute-force and abuse.

3. **CORS wildcard** — `allow_origins=["*"]` is too permissive for production. Should be restricted to the actual frontend domain.

4. **JWT secret fallback** — `JWT_SECRET` defaults to `"dev-secret-change-me"` if not set. The app should refuse to start in production without a proper secret.

5. **No password complexity enforcement** — The backend accepts any password hash. Server-side validation of password strength is missing.

6. **Cloud API pricing stubs** — The `_fetch_rate_from_api()` functions in all three pricing modules return hardcoded stub data. Actual cloud pricing API integrations (AWS Cost Explorer, Azure Retail Prices, GCP Cloud Billing) are not implemented.

7. **No token refresh** — JWTs expire after 24 hours with no refresh mechanism. Users must re-login.

8. **Missing input validation on calculate-cost** — The `parameters` dict is passed directly to calculators without schema validation. Malformed parameters could cause unexpected errors.

9. **Database migration** — Tables are created via `create_all()` on startup. There's no Alembic migration setup despite `alembic` being in requirements.txt.

10. **No credential decryption usage** — `decrypt_credential()` exists but is never called. Stored cloud credentials are encrypted but never used for actual cloud API calls.

### Frontend

1. **No route protection** — Dashboard pages (`/overview`, `/optimization`, `/calculator`, etc.) don't require authentication. Any visitor can access them.

2. **Reporting page is static** — The reports table is hardcoded. No actual report generation or download functionality.

3. **Infrastructure page is a placeholder** — Shows "Coming Soon" text only.

4. **No error boundaries** — React error boundaries are not implemented. Unhandled errors crash the entire app.

5. **No form validation library** — Forms use manual validation. A library like Zod or React Hook Form would improve consistency.

6. **Accessibility gaps** — While basic ARIA labels exist (ThemeToggle), many interactive elements lack proper ARIA attributes, keyboard navigation support, and screen reader announcements.

7. **AdminContext uses build-time env var** — `VITE_ADMIN` is a build-time flag that controls admin visibility globally. The `DashboardLayout` sidebar uses the JWT role for per-user admin visibility, but `AdminContext` still relies on the build arg. These two mechanisms should be unified.

### Security

1. **Client-side password hashing** — SHA-256 hashing in the browser provides limited security benefit since the hash itself becomes the credential. If intercepted, the hash can be replayed.

2. **No HTTPS enforcement in dev** — The Express server and FastAPI both serve over HTTP. HTTPS is only enforced at the ALB level in production.

3. **Sensitive data in .env** — The `.env` file contains actual API keys and database credentials. While gitignored, there's no secrets management integration (e.g., AWS Secrets Manager).

4. **No audit logging** — User actions (login, profile changes, credential storage) are logged but there's no structured audit trail.

---

## Improvement Suggestions

### High Priority

- **Implement route guards** — Protect dashboard routes with authentication checks. Redirect unauthenticated users to `/login`.
- **Add rate limiting** — Use `slowapi` or similar to rate-limit auth endpoints and cost calculations.
- **Restrict CORS origins** — Set `allow_origins` to the actual frontend domain(s).
- **Set up Alembic migrations** — Replace `create_all()` with proper migration scripts for safe schema evolution.
- **Implement real dashboard data** — Query `cost_calculations` table to generate actual stats, trends, and recommendations.

### Medium Priority

- **Add token refresh** — Implement a `/api/refresh` endpoint that issues new tokens before expiry.
- **Implement cloud pricing APIs** — Replace stub `_fetch_rate_from_api()` with actual AWS Cost Explorer, Azure Retail Prices, and GCP Cloud Billing API integrations.
- **Use stored credentials** — Decrypt and use stored cloud credentials to fetch real usage data and costs from user accounts.
- **Add React error boundaries** — Wrap major sections in error boundaries for graceful failure handling.
- **Implement report generation** — Connect the Reporting page to actual data export functionality (CSV, PDF).
- **Add WebSocket support** — For real-time cost monitoring and live optimization alerts.

### Low Priority

- **Add pagination** — Admin user list and cost calculation history should support pagination.
- **Implement search** — Add search/filter capabilities to the optimization recommendations and reports.
- **Add unit tests for frontend** — The test setup exists but coverage is minimal.
- **Implement the Infrastructure page** — Show actual cloud resource inventory.
- **Add multi-language support** — i18n for the frontend.
- **Implement SSO** — Support OAuth2/OIDC providers (Google, GitHub, etc.) for enterprise use.

### Architecture

- **Extract pricing into a microservice** — The pricing logic is complex enough to warrant its own service with dedicated caching.
- **Add a message queue** — For async cost calculations and background pricing updates (e.g., SQS, Redis).
- **Implement proper secrets management** — Use AWS Secrets Manager or HashiCorp Vault instead of environment variables for sensitive values.
- **Add OpenTelemetry** — Distributed tracing for debugging cross-service issues.
- **Database read replicas** — For scaling read-heavy dashboard queries.
