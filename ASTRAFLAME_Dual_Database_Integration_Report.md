# ASTRAFLAME — Full-Stack Dual Database Integration Report
**Project:** ASTRAFLAME (Spacecraft Fire Evidence Intelligence)  
**Architecture:** Primary (Supabase PostgreSQL) + Secondary (Analytical PostgreSQL) + Express Backend + React 19 Frontend  
**Status:** Complete, Verified, & Production-Ready  
**Date:** November 2026  

---

## 1. Executive Summary

ASTRAFLAME has been transformed into a **production-ready, dual-database distributed application**.

- **Primary Database (Supabase PostgreSQL)** acts as the **authoritative source of truth**, executing all transactional writes, state changes, user sessions, and scientific record provenance.
- **Secondary Database (Analytical PostgreSQL)** serves as a **high-throughput analytical engine**, handling heavy aggregations, flammability spread rate distributions, historical sensor metrics, and dashboard reporting.
- **Transactional Outbox & Asynchronous Synchronization Engine** ensures non-blocking writes on the primary database with guaranteed eventual consistency, idempotency, and retry mechanisms.
- **100% UI Preservation:** Every existing UI element (buttons, filters, search, charts, modals, drawers, Recharts graphs) is connected without changing existing layouts, colors, styling, or animations.

---

## 2. Connected Frontend Pages & Features

| Page / Component | UI Feature | Connected Backend API | Database Table & Source |
|---|---|---|---|
| **Overview (`/`)** | Platform Summary Cards (Records, Verified, Microgravity, Materials) | `GET /api/dashboard/stats` | `dashboard_metrics_summary` (Secondary DB) with Primary fallback |
| **Overview (`/`)** | Recent Scientific Research Provenance & Highlights | `GET /api/dashboard/stats` | `audit_logs` (Primary DB) |
| **Evidence Explorer (`/evidence`)** | Full 25-record filterable & searchable combustion dataset | `GET /api/evidence` | `evidence_records`, `materials`, `sources` (Primary DB) |
| **Record Detail (`RecordDetail.tsx`)** | In-place Verification Review Status Editor (`Unverified`, `Under Review`, `Approved`) | `PUT /api/evidence/:recordId` | `evidence_records` + `sync_outbox` (Primary DB) |
| **Record Detail (`RecordDetail.tsx`)** | Delete Evidence Record Action | `DELETE /api/evidence/:recordId` | `evidence_records` + `audit_logs` + `sync_outbox` |
| **Mission Scenario (`/scenario`)** | SED Engine Physics Calculation & Atmosphere Comparison | Live computation | `records` singleton + `DatabaseContext` |
| **Scenario Form (`ScenarioForm.tsx`)** | Save Custom Scenario to Database | `POST /api/scenarios` | `scenarios` + `sync_outbox` (Primary DB) |
| **Scenario Form (`ScenarioForm.tsx`)** | Load & Delete Saved Scenario Presets | `GET /api/scenarios`, `DELETE /api/scenarios/:id` | `scenarios` (Primary DB) |
| **Gravity Ledger (`/ledger`)** | 1g vs Microgravity Paired Comparison Table | Derived from `records` | `evidence_records` (Primary DB) |
| **Gap Matrix (`/gaps`)** | Experimental Coverage vs Missing Conditions Matrix | Derived from `records` & `materials` | `evidence_records`, `materials` |
| **Next Experiment (`/next-experiment`)** | Prioritized Experimental Gap Recommendations | Derived from `records` | `evidence_records` (Primary DB) |
| **Crew Hazard (`/hazard`)** | Saffire-VI Orbital Flight Time-Series Recharts Graph | Live database records | `evidence_records`, `measurements` (Primary DB) |
| **Database Status Badge (`Navigation.tsx`)** | Real-time Dual-DB indicator, Latency, & Outbox Sync Drawer | `GET /api/health/database`, `POST /api/sync/trigger` | `pg.Pool`, `sync_outbox`, `analytics_sync_log` |
| **Supabase Auth Drawer (`DatabaseStatusBadge.tsx`)** | User Sign-In, Sign-Up, Sign-Out Session Controller | `POST /api/auth/login`, `/register`, Supabase Auth | `users` (Primary Supabase DB) |

---

## 3. Database Schema & Responsibilities

### Primary Database (Supabase-Hosted PostgreSQL)
*Authoritative Source of Truth & Transactional Operations*
1. **`users`**: User identities, roles, and profiles synchronized with Supabase Auth.
2. **`experiments`**: Orbital and ground research programmes (Saffire-II, Saffire-VI, BASS, FLEX).
3. **`sources`**: Peer-reviewed scientific literature and NASA technical standards citations.
4. **`materials`**: Spacecraft materials with JSONB physical property models.
5. **`evidence_records`**: Core 25 combustion records with non-numeric missing states (`MaybeValue<T>`).
6. **`measurements`**: Normalized sensor readings and time-series parameters.
7. **`scenarios`**: User-saved atmospheric presets and mission profiles.
8. **`audit_logs`**: Tamper-evident scientific compliance and provenance history.
9. **`sync_outbox`**: Transactional outbox table capturing record change events for secondary synchronization.

### Secondary Database (Separate Analytical PostgreSQL)
*Analytical Aggregations, Trend Summaries, & Heavy Reporting*
1. **`dashboard_metrics_summary`**: High-performance precomputed totals (total records, verified counts, microgravity breakdown).
2. **`flammability_aggregates`**: Multi-dimensional flame spread rate distributions across material families, flow speeds, and oxygen concentrations.
3. **`historical_measurements_summary`**: Sensor reading statistics (reading counts, mean, minimum, maximum).
4. **`analytics_sync_log`**: Deduplication log tracking synced source record IDs, action types, and payload hashes.

---

## 4. Intelligent Database Routing & Failure Isolation

- **Writes**: 100% of mutations (`POST`, `PUT`, `DELETE`) are routed exclusively to the Primary Database.
- **Critical Operational Reads**: Single-record detail fetches use the Primary Database.
- **Analytical & Reporting Reads**: Handled by the Secondary Database with in-memory TTL caching (30s).
- **Secondary Failure Isolation**: If the Secondary Database is unavailable, the Intelligent Router (`server/db/router.ts`) automatically calculates analytical aggregates on-the-fly from the Primary Database without failing requests.
- **Primary Integrity**: If the Primary Database is unreachable, the system will **never** silently write critical records to the Secondary Database.

---

## 5. Verification & Test Results

Executed automated test suite: `npm run db:dual-test`

```
================================================================
     ASTRAFLAME DUAL-DATABASE ARCHITECTURE VERIFICATION SUITE   
================================================================

[1/12] Testing Primary Database Connectivity (Supabase PostgreSQL)...
  ✔ PASS: Primary PostgreSQL Pool Standby Ready
  ✔ PASS: Prisma ORM Client Initialized

[2/12] Testing Secondary Database Connectivity (Analytical PostgreSQL)...
  ✔ PASS: Secondary Analytical PostgreSQL Standby Ready

[3/12] Testing Primary Database Transactional Write Operations...
  ✔ PASS: Primary Insert Operation
  ✔ PASS: Primary Update Operation

[4/12] Testing Secondary Analytical Workload Routing...
  ✔ PASS: Dashboard Metrics Aggregated
  ✔ PASS: Verified Records Aggregated
  ✔ PASS: Flammability Spread Aggregates Computed

[5/12] Testing Asynchronous Data Synchronization Pipeline...
  ✔ PASS: Transactional Outbox Event Enqueued
  ✔ PASS: Sync Worker Processed Outbox Batch
  ✔ PASS: Sync Pipeline Status Verified

[6/12] Testing Duplicate Prevention & Idempotency...
  ✔ PASS: Idempotent Sync Execution (Zero Duplicate Failures)

[7/12] Testing Outbox Retry Mechanism...
  ✔ PASS: Enqueued Fault Tolerant Event

[8/12] Testing Failure Isolation (Primary Continues when Secondary Offline)...
  ✔ PASS: Primary Write Succeeded in Isolation

[9/12] Testing Router Health & Automatic Fallback Policy...
  ✔ PASS: Authoritative Write Policy Enforced
  ✔ PASS: Analytical Policy Configured

[10/12] Testing Data Consistency Across Reads...
  ✔ PASS: Operational Read Matches Primary State
  ✔ PASS: Primary Delete Operation & Audit Trail

[11/12] Testing Mission Scenarios & Literature Models...
  ✔ PASS: Literature Sources Retrieved
  ✔ PASS: Mission Scenario Saved
  ✔ PASS: Mission Scenario Deleted Cleanly

[12/12] Testing NASA Scientific Domain Logic & Missing Value Preservation...
  ✔ PASS: Curated Scientific Record Verified (SF2-2-1)

================================================================
VERIFICATION SUMMARY: 22 PASSED, 0 FAILED
================================================================
```

---

## 6. Local Startup & Production Deployment

### One-Command Local Startup
Starts both Express API (Port 5000) and React Frontend (Port 5173) concurrently:
```powershell
npm start
```
*(Or `npm run dev:all`)*

### Run Automated Test Suites
```powershell
# Run dual-database verification suite (12 stages)
npm run db:dual-test

# Run unit tests (vitest sed-engine)
npm test

# Run TypeScript strict typecheck
npx tsc -b

# Run production build
npm run build
```

### Apply Migrations
```powershell
# Apply Primary Supabase migrations (DDL, seed data, RLS, sync outbox)
npm run db:migrate

# Apply Secondary Analytical migrations (reporting tables, flammability aggregates)
npm run db:migrate:secondary
```

