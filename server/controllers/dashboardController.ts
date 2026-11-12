// Dashboard Controller: aggregates database statistics for ASTRAFLAME
// Uses Intelligent Database Router for Secondary PostgreSQL analytical distribution
// with seamless Primary PostgreSQL fallback and TTL cache.

import type { Request, Response } from 'express';
import { getDashboardAnalytics, getRoutingStatus } from '../db/router.ts';
import {
  fetchEvidenceRecords,
  fetchSources,
  fetchExperiments,
  fetchMaterials,
  fetchScenarios,
  fetchAuditLogs,
} from '../services/dataService.ts';

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [analyticsSummary, routingStatus, records, sources, experiments, materials, scenarios, auditLogs] =
      await Promise.all([
        getDashboardAnalytics(),
        getRoutingStatus(),
        fetchEvidenceRecords(),
        fetchSources(),
        fetchExperiments(),
        fetchMaterials(),
        fetchScenarios(),
        fetchAuditLogs(10),
      ]);

    // Breakdown by gravity category
    const gravityBreakdown = records.reduce((acc: Record<string, number>, r) => {
      acc[r.gravity_category] = (acc[r.gravity_category] || 0) + 1;
      return acc;
    }, {});

    // Breakdown by material family
    const materialBreakdown = records.reduce((acc: Record<string, number>, r) => {
      acc[r.material_family] = (acc[r.material_family] || 0) + 1;
      return acc;
    }, {});

    // Review status breakdown
    const statusBreakdown = records.reduce((acc: Record<string, number>, r) => {
      acc[r.review_status] = (acc[r.review_status] || 0) + 1;
      return acc;
    }, {});

    // Tier 1 vs Tier 2
    const tierCounts = records.reduce(
      (acc, r) => {
        if (r.tier === 1) acc.tier1 += 1;
        else if (r.tier === 2) acc.tier2 += 1;
        return acc;
      },
      { tier1: 0, tier2: 0 }
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalRecords: analyticsSummary.totalRecords || records.length,
          verifiedRecords: analyticsSummary.verifiedRecords,
          microgravityRecords: analyticsSummary.microgravityRecords,
          normalGravityRecords: analyticsSummary.normalGravityRecords,
          totalExperiments: experiments.length,
          totalSources: sources.length,
          totalMaterials: materials.length,
          totalScenarios: scenarios.length,
          totalMeasurements: records.length * 6,
          tier1FlightRecords: tierCounts.tier1,
          tier2LiteratureRecords: tierCounts.tier2,
          analyticsSource: analyticsSummary.source,
          cachedAt: analyticsSummary.cachedAt,
        },
        distributions: {
          byGravity: gravityBreakdown,
          byMaterial: materialBreakdown,
          byReviewStatus: statusBreakdown,
        },
        routing: routingStatus,
        recentActivities: auditLogs.slice(0, 5),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
