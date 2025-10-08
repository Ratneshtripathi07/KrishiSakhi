// server/src/api/controllers/AdminGeoAnalyticsController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class AdminGeoAnalyticsController {
  static async analytics(req: Request, res: Response) {
    const { state, city, constituency } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (state) where.state = state;
    if (city) where.city = city;
    if (constituency) where.constituency = constituency;

    // Aggregate by state, city, constituency counts for charts
    const total = await prisma.user.count({ where });

    // Use raw queries for robust aggregation across Prisma versions
    const clauses: string[] = [];
    const params: any[] = [];
    if (state) { params.push(state); clauses.push(`state = $${params.length}`); }
    if (city) { params.push(city); clauses.push(`city = $${params.length}`); }
    if (constituency) { params.push(constituency); clauses.push(`constituency = $${params.length}`); }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const byStateRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT state AS label, COUNT(*)::int AS count FROM "User" ${whereSql} GROUP BY state HAVING state IS NOT NULL ORDER BY count DESC`,
      ...params,
    );
    const byCityRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT city AS label, COUNT(*)::int AS count FROM "User" ${whereSql} GROUP BY city HAVING city IS NOT NULL ORDER BY count DESC`,
      ...params,
    );
    const byConstituencyRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT constituency AS label, COUNT(*)::int AS count FROM "User" ${whereSql} GROUP BY constituency HAVING constituency IS NOT NULL ORDER BY count DESC`,
      ...params,
    );

    return res.json({
      total,
      byState: byStateRows,
      byCity: byCityRows,
      byConstituency: byConstituencyRows,
    });
  }
}
