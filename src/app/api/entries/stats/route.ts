import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, users, entryTypes } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, getUserId, getTeamId } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/entries/stats - Get entry statistics
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Validate date range
    const { startDate, endDate } = dateRangeSchema.parse(params);

    // Build conditions
    const conditions = [];

    if (startDate) {
      conditions.push(gte(entries.entryTime, new Date(startDate)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(entries.entryTime, endDateTime));
    }

    // Filter by role
    if (session.user.role === "employee") {
      conditions.push(eq(entries.employeeId, getUserId(session)));
    } else if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        conditions.push(eq(users.teamId, teamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total entries count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    // Get entries by type
    const entriesByType = await db
      .select({
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        count: sql<number>`count(*)::int`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(whereClause)
      .groupBy(entries.entryTypeId, entryTypes.name);

    // Get entries by employee (if team leader or admin)
    let entriesByEmployee = [];
    if (session.user.role !== "employee") {
      entriesByEmployee = await db
        .select({
          employeeId: entries.employeeId,
          employeeName: users.fullName,
          count: sql<number>`count(*)::int`,
        })
        .from(entries)
        .leftJoin(users, eq(entries.employeeId, users.id))
        .where(whereClause)
        .groupBy(entries.employeeId, users.fullName);
    }

    // Get quality stats
    const [qualityStats] = await db
      .select({
        totalEntries: sql<number>`count(*)::int`,
        followsNamingConvention: sql<number>`count(*) filter (where ${entries.followsNamingConvention} = true)::int`,
        followsSpecificationOrder: sql<number>`count(*) filter (where ${entries.followsSpecificationOrder} = true)::int`,
        hasUnwantedKeywords: sql<number>`count(*) filter (where ${entries.containsUnwantedKeywords} = true)::int`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    return successResponse({
      total: totalResult.count,
      byType: entriesByType,
      byEmployee: entriesByEmployee,
      qualityMetrics: {
        namingConventionCompliance:
          qualityStats.totalEntries > 0
            ? (qualityStats.followsNamingConvention /
                qualityStats.totalEntries) *
              100
            : 0,
        specificationOrderCompliance:
          qualityStats.totalEntries > 0
            ? (qualityStats.followsSpecificationOrder /
                qualityStats.totalEntries) *
              100
            : 0,
        unwantedKeywordsRate:
          qualityStats.totalEntries > 0
            ? (qualityStats.hasUnwantedKeywords / qualityStats.totalEntries) *
              100
            : 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
