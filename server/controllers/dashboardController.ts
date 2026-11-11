// Dashboard Controller: aggregates database statistics for ASTRAFLAME
import type { Request, Response } from 'express';
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
    const [records, sources, experiments, materials, scenarios, auditLogs] = await Promise.all([
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

    // Approximate total measurements across records
    const estimatedMeasurements = records.length * 6;

    res.json({
      success: true,
      data: {
        summary: {
          totalRecords: records.length,
          totalExperiments: experiments.length,
          totalSources: sources.length,
          totalMaterials: materials.length,
          totalScenarios: scenarios.length,
          totalMeasurements: estimatedMeasurements,
          tier1FlightRecords: tierCounts.tier1,
          tier2LiteratureRecords: tierCounts.tier2,
        },
        distributions: {
          byGravity: gravityBreakdown,
          byMaterial: materialBreakdown,
          byReviewStatus: statusBreakdown,
        },
        recentActivities: auditLogs.slice(0, 5),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

