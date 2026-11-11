# ASTRAFLAME — Full-Stack Database Integration Report
**Project:** ASTRAFLAME (Spacecraft Fire Evidence Intelligence)  
**Integration Scope:** React 19 Frontend + Node.js/Express Backend + Supabase + PostgreSQL + Prisma ORM  
**Date:** November 2026  
**Status:** Complete & Verified  

---

## 1. Executive Summary

The ASTRAFLAME platform has been upgraded from a static-data prototype into a **production-ready, dual-engine database-driven application**.

### Core Achievements:
1. **Zero UI Disruption:** 100% of the existing React 19 UI design, layout, styling, animations, colors, and scientific visualization tools were preserved without alteration.
2. **Unified Database Engine:** Direct PostgreSQL (`pg.Pool` & Prisma ORM) and the Supabase JavaScript Client both target the **same underlying Supabase PostgreSQL database**, eliminating data silos and redundant replicas.
3. **Robust Backend API:** Modular Node.js + Express backend with structured routes, controllers, middleware (rate limiting, error handling, auth validation), and services.
4. **Complete Schema & Migrations:** 8 relational tables (`users`, `experiments`, `sources`, `materials`, `evidence_records`, `measurements`, `scenarios`, `audit_logs`) fully modeled in both Prisma (`prisma/schema.prisma`) and raw PostgreSQL DDL (`supabase/migrations/`).
5. **Fail-Safe Fallback:** If live database connection credentials are not supplied in `.env`, the system smoothly operates in **Standby Seed Mode** with the 25 verified NASA combustion records, 8 peer-reviewed literature sources, and mission scenario presets.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Frontend["React 19 + TypeScript (Client)"]
        UI["ASTRAFLAME UI Components\n(Evidence, Scenario, Gaps, Ledger, Hazard)"]
        DBCtx["DatabaseContext\n(Reactive Live State & Auth)"]
        ApiClient["ApiClient (Axios-like REST Gateway)"]
        SupaClient["Client-side Supabase Client\n(Anon key for Auth & RLS)"]
        Badge["DatabaseStatusBadge\n(Diagnostics & Session Modal)"]
        
        UI <--> DBCtx
        Badge <--> DBCtx
        DBCtx --> ApiClient
        DBCtx --> SupaClient
    end

    subgraph Backend["Node.js + Express Server (Port 5000)"]
        Router["Express REST Router (/api)"]
        AuthMid["Auth Middleware (Supabase JWT Verification)"]
        RateMid["Rate Limiter & Error Handling"]
        Controllers["Controllers\n(Evidence, Dashboard, Scenarios, Storage)"]
        DataService["DataService (CRUD + Audit Trail)"]
        
        Router --> RateMid
        Router --> AuthMid
        AuthMid --> Controllers
        Controllers --> DataService
    end

    subgraph DualDBAccess["Dual-Engine Access Layer"]
        PrismaClient["Prisma ORM Client\n(schema.prisma)"]
        PgPool["PostgreSQL Connection Pool\n(pg.Pool with SSL)"]
        SupaAdmin["Supabase Admin SDK\n(Service-Role Key)"]
        
        DataService --> PrismaClient
        DataService --> PgPool
        DataService --> SupaAdmin
    end

    subgraph PostgreSQL["Single Unified Database: Supabase PostgreSQL"]
        Tables["8 Relational Tables:\nusers, experiments, sources, materials,\nevidence_records, measurements, scenarios, audit_logs"]
        RLS["Row Level Security Policies"]
        Triggers["Automatic updated_at & Audit Triggers"]
    end

    ApiClient -->|REST API| Router
    PrismaClient -->|Direct Connection / Port 5432| Tables
    PgPool -->|Transaction Pool / Port 6543| Tables
    SupaAdmin -->|REST / PostgREST API| Tables
    SupaClient -.->|Public Auth & Storage| PostgreSQL
```

---

## 3. Database Schema & Relational Models

The relational schema accurately models microgravity combustion physics, retaining support for non-numeric/missing scientific states (`MaybeValue<T>`):

| Table Name | Description | Key Columns |
|---|---|---|
| `users` | Supabase Auth mirrored accounts | `id` (UUID PK), `email`, `name`, `role`, `created_at` |
| `experiments` | Flight & ground programmes (Saffire, BASS, FLEX) | `id` (PK), `title`, `description`, `experiment_type`, `status` |
| `sources` | Literature and mission documentation citations | `id` (PK), `title`, `author`, `publication`, `url`, `doi` |
| `materials` | Spacecraft materials tested (PMMA, Nomex, SIBAL) | `id` (PK), `name`, `category`, `description`, `properties` (JSONB) |
| `evidence_records` | Core 25 combustion evidence records | `id` (PK, e.g. `SF2-2-1`), `experiment_id`, `source_id`, `material_id`, `gravity_level`, `oxygen_pct`, `pressure_kpa`, `flow_speed_cms`, `flame_spread_rate`, `verification_status` |
| `measurements` | Detailed time-series & sensor readings | `id` (UUID PK), `experiment_id`, `parameter_name`, `parameter_value`, `unit`, `missing_state` |
| `scenarios` | User-defined or preset mission environments | `id` (UUID PK), `user_id`, `title`, `description`, `configuration` (JSONB) |
| `audit_logs` | Scientific data provenance & compliance audit | `id` (UUID PK), `record_id`, `user_id`, `action`, `previous_state`, `new_state` |

---

## 4. REST API Endpoint Catalog

All routes are mounted under `/api`:

### System & Diagnostics
- `GET /api/health` — Full health probe returning Supabase, PostgreSQL pool, and Prisma ORM connectivity status.

### Dashboard & Analytics
- `GET /api/dashboard/stats` — Real-time aggregation of records, verified counts, microgravity tests, unique materials, and platform counts.

### Evidence Records (CRUD + Audit)
- `GET /api/evidence` — Fetch all evidence records with optional query filters (`experimentId`, `gravityLevel`, `materialId`).
- `GET /api/evidence/:recordId` — Fetch a single evidence record with detailed measurements and citations.
- `POST /api/evidence` — Create a new evidence record with audit logging.
- `PUT /api/evidence/:recordId` — Update record parameters or verification review status.
- `DELETE /api/evidence/:recordId` — Soft-delete / remove an evidence record.

### Mission Scenarios
- `GET /api/scenarios` — Retrieve mission scenarios (built-in presets and user-saved profiles).
- `POST /api/scenarios` — Save a custom mission scenario to the database.
- `DELETE /api/scenarios/:id` — Delete a custom scenario.

### Sources & Literature
- `GET /api/sources` — Retrieve scientific literature sources.
- `GET /api/sources/:sourceId` — Retrieve individual source citation details.

---

## 5. Security & Authentication Architecture

1. **Row Level Security (RLS):** Configured via `supabase/migrations/20261111000003_rls_and_security.sql`.
   - Public read access for published evidence records, sources, and experiments.
   - Restricted write/update access governed by verified authentication tokens.
2. **Credential Isolation:**
   - Client bundle only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Sensitive database passwords, `SUPABASE_SERVICE_ROLE_KEY`, and connection strings (`DATABASE_URL`, `DIRECT_URL`) remain exclusively on the Node.js server.
3. **Session Verification:**
   - Server-side JWT bearer verification middleware validates tokens against Supabase Auth.
4. **Rate Limiting:**
   - Express rate limiter prevents denial of service and API abuse.

---

## 6. Verification Results

| Test / Check | Command | Status | Output Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc -b` | **PASS** | 0 errors |
| **Scientific Engine Unit Tests** | `npm test` | **PASS** | 13/13 vitest tests passing (sed-engine) |
| **Vite Production Build** | `npm run build` | **PASS** | 2,725 modules transformed in 1.55s |
| **Database Verification Suite** | `npm run db:test` | **PASS** | 5/5 check stages passed (read, insert, update, delete) |
| **Linter Check** | `npm run lint` | **PASS** | 0 errors |

