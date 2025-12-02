import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, users, entryTypes } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  requireAuth,
  getUserId,
  getTeamId,
  isAdmin,
} from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";

/**
 * GET /api/reports/daily - Get daily productivity report
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Get date from query params, default to today
    const dateParam = params.date || new Date().toISOString().split("T")[0];
    const targetDate = new Date(dateParam);

    // Set date range for the entire day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build conditions based on role
    const conditions = [
      gte(entries.entryTime, startOfDay),
      lte(entries.entryTime, endOfDay),
    ];

    // Employees see only their own data
    if (session.user.role === "employee") {
      conditions.push(eq(entries.employeeId, getUserId(session)));
    }
    // Team leaders see only their team's data
    else if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        conditions.push(eq(users.teamId, teamId));
      }
    }

    // Get overall daily statistics
    const [dailyStats] = await db
      .select({
        totalEntries: sql<number>`count(*)::int`,
        uniqueEmployees: sql<number>`count(distinct ${entries.employeeId})::int`,
        followsNamingConvention: sql<number>`count(*) filter (where ${entries.followsNamingConvention} = true)::int`,
        followsSpecificationOrder: sql<number>`count(*) filter (where ${entries.followsSpecificationOrder} = true)::int`,
        hasUnwantedKeywords: sql<number>`count(*) filter (where ${entries.containsUnwantedKeywords} = true)::int`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions));

    // Get entries by hour (for hourly distribution)
    const hourlyDistribution = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${entries.entryTime})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions))
      .groupBy(sql`EXTRACT(HOUR FROM ${entries.entryTime})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${entries.entryTime})`);

    // Get entries by employee
    const entriesByEmployee = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        count: sql<number>`count(*)::int`,
        firstEntry: sql<string>`MIN(${entries.entryTime})`,
        lastEntry: sql<string>`MAX(${entries.entryTime})`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions))
      .groupBy(entries.employeeId, users.fullName);

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
      .where(and(...conditions))
      .groupBy(entries.entryTypeId, entryTypes.name);

    return successResponse({
      date: dateParam,
      summary: {
        totalEntries: dailyStats.totalEntries,
        activeEmployees: dailyStats.uniqueEmployees,
        averagePerEmployee:
          dailyStats.uniqueEmployees > 0
            ? Math.round(dailyStats.totalEntries / dailyStats.uniqueEmployees)
            : 0,
        qualityMetrics: {
          namingConventionCompliance:
            dailyStats.totalEntries > 0
              ? (dailyStats.followsNamingConvention / dailyStats.totalEntries) *
                100
              : 0,
          specificationOrderCompliance:
            dailyStats.totalEntries > 0
              ? (dailyStats.followsSpecificationOrder /
                  dailyStats.totalEntries) *
                100
              : 0,
          unwantedKeywordsRate:
            dailyStats.totalEntries > 0
              ? (dailyStats.hasUnwantedKeywords / dailyStats.totalEntries) * 100
              : 0,
        },
      },
      hourlyDistribution,
      byEmployee: entriesByEmployee,
      byType: entriesByType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
