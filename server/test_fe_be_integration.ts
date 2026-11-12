// Test Frontend <-> Backend API Integration
import app from './index.ts';

const PORT = 5099; // Test port

const server = app.listen(PORT, async () => {
  console.log(`Test Express server running on port ${PORT}`);
  let failed = 0;

  async function checkEndpoint(name: string, path: string, options: RequestInit = {}) {
    try {
      const res = await fetch(`http://localhost:${PORT}${path}`, options);
      const json = await res.json();
      if (res.ok && (json.success !== false || json.status === 'healthy' || json.status === 'degraded')) {
        console.log(`  ✔ [${res.status}] ${name} -> OK`);
        return true;
      } else {
        console.error(`  ✘ [${res.status}] ${name} -> Failed:`, json);
        failed++;
        return false;
      }
    } catch (err: any) {
      console.error(`  ✘ [ERROR] ${name} -> ${err.message}`);
      failed++;
      return false;
    }
  }

  console.log('\n--- VERIFYING FRONTEND <-> BACKEND ENDPOINTS ---');
  await checkEndpoint('System Health (/api/health)', '/api/health');
  await checkEndpoint('Dual DB Diagnostics (/api/health/database)', '/api/health/database');
  await checkEndpoint('Dashboard Stats (/api/dashboard/stats)', '/api/dashboard/stats');
  await checkEndpoint('Evidence Records (/api/evidence)', '/api/evidence');
  await checkEndpoint('Mission Scenarios (/api/scenarios)', '/api/scenarios');
  await checkEndpoint('Flammability Aggregates (/api/analytics/flammability)', '/api/analytics/flammability');
  await checkEndpoint('Sync Engine Status (/api/sync/status)', '/api/sync/status');

  console.log('\n--- TESTING MUTATION FROM FRONTEND ---');
  await checkEndpoint('Create Scenario (POST /api/scenarios)', '/api/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'FE-BE Integration Test Scenario',
      gravity_category: 'microgravity',
      gravity_g: 0.0001,
      oxygen_pct: 21,
      total_pressure_kpa: 101.3,
      airflow_cm_s: 20,
      flow_direction: 'concurrent',
      material_family: 'pmma',
      material_type: 'PMMA sheet',
      geometry: 'flat-sheet',
      thickness_mm: 6.35,
    }),
  });

  server.close(() => {
    console.log(`\nFrontend <-> Backend Integration: ${failed === 0 ? 'ALL CHECKS PASSED ✔' : 'FAILED ✘'}`);
    process.exit(failed === 0 ? 0 : 1);
  });
});
