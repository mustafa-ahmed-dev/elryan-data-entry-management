import { db } from "../index";
import {
  entries,
  qualityEvaluations,
  users,
  teams,
  entryTypes,
} from "../schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  getEntryCountByEmployee,
  getHourlyEntryStats,
  getEntryTypeDistribution,
  getViolationStats,
} from "./entries";
import { calculateAverageScore, getViolationStatistics } from "./evaluations";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EmployeePerformanceReport {
  employeeId: number;
  employeeName: string;
  period: { start: Date; end: Date };
  totalEntries: number;
  averageScore: number;
  violationStats: {
    naming: number;
    specification: number;
    keywords: number;
  };
  entryTypeDistribution: Array<{
    entryTypeId: number;
    entryTypeName: string | null;
    count: number;
  }>;
  hourlyPattern: Array<{
    hour: number;
    count: number;
    violations: number;
  }>;
}

export interface TeamPerformanceReport {
  teamId: number;
  teamName: string;
  period: { start: Date; end: Date };
  totalEntries: number;
  teamAverageScore: number;
  members: Array<{
    employeeId: number;
    employeeName: string;
    entries: number;
    avgScore: number;
  }>;
}

// ============================================================================
// EMPLOYEE REPORTS
// ============================================================================

/**
 * Get comprehensive employee performance report
 */
export async function getEmployeePerformanceReport(
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<EmployeePerformanceReport> {
  try {
    // Get employee info
    const [employee] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Get all metrics in parallel
    const [
      totalEntries,
      averageScore,
      violationStats,
      entryTypeDistribution,
      hourlyPattern,
    ] = await Promise.all([
      getEntryCountByEmployee(employeeId, startDate, endDate),
      calculateAverageScore(employeeId, startDate, endDate),
      getViolationStats(employeeId, startDate, endDate),
      getEntryTypeDistribution(employeeId, startDate, endDate),
      getHourlyEntryStats(employeeId, startDate),
    ]);

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      period: { start: startDate, end: endDate },
      totalEntries,
      averageScore,
      violationStats: {
        naming: violationStats.namingViolations,
        specification: violationStats.specViolations,
        keywords: violationStats.keywordViolations,
      },
      entryTypeDistribution,
      hourlyPattern,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate employee performance report: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// TEAM REPORTS
// ============================================================================

/**
 * Get team performance report
 */
export async function getTeamPerformanceReport(
  teamId: number,
  startDate: Date,
  endDate: Date
): Promise<TeamPerformanceReport> {
  try {
    // Get team info
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      throw new Error("Team not found");
    }

    // Get team members
    const members = await db
      .select({
        id: users.id,
        fullName: users.fullName,
      })
      .from(users)
      .where(and(eq(users.teamId, teamId), eq(users.isActive, true)));

    // Get stats for each member
    const memberStats = await Promise.all(
      members.map(async (member) => {
        const entries = await getEntryCountByEmployee(
          member.id,
          startDate,
          endDate
        );
        const avgScore = await calculateAverageScore(
          member.id,
          startDate,
          endDate
        );

        return {
          employeeId: member.id,
          employeeName: member.fullName,
          entries,
          avgScore,
        };
      })
    );

    // Calculate team totals
    const totalEntries = memberStats.reduce((sum, m) => sum + m.entries, 0);
    const teamAverageScore =
      memberStats.length > 0
        ? memberStats.reduce((sum, m) => sum + m.avgScore, 0) /
          memberStats.length
        : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      period: { start: startDate, end: endDate },
      totalEntries,
      teamAverageScore,
      members: memberStats.sort((a, b) => b.avgScore - a.avgScore),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate team performance report: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// DAILY REPORTS
// ============================================================================

/**
 * Get daily productivity report for all employees
 */
export async function getDailyProductivityReport(date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        totalEntries: sql<number>`cast(COUNT(${entries.id}) as integer)`,
        violations: sql<number>`cast(SUM(CASE WHEN ${entries.followsNamingConvention} = false OR ${entries.followsSpecificationOrder} = false OR ${entries.containsUnwantedKeywords} = true THEN 1 ELSE 0 END) as integer)`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(
        and(
          gte(entries.entryTime, startOfDay),
          lte(entries.entryTime, endOfDay)
        )
      )
      .groupBy(entries.employeeId, users.fullName)
      .orderBy(desc(sql`COUNT(${entries.id})`));

    return result.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      totalEntries: Number(row.totalEntries),
      violations: Number(row.violations),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate daily productivity report: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// QUALITY TRENDS
// ============================================================================

/**
 * Get quality trends over time period
 */
export async function getQualityTrendsReport(startDate: Date, endDate: Date) {
  try {
    const result = await db
      .select({
        date: sql<string>`DATE(${qualityEvaluations.evaluatedAt})`,
        avgScore: sql<number>`AVG(${qualityEvaluations.totalScore})`,
        evaluationCount: sql<number>`cast(COUNT(*) as integer)`,
      })
      .from(qualityEvaluations)
      .where(
        and(
          gte(qualityEvaluations.evaluatedAt, startDate),
          lte(qualityEvaluations.evaluatedAt, endDate)
        )
      )
      .groupBy(sql`DATE(${qualityEvaluations.evaluatedAt})`)
      .orderBy(sql`DATE(${qualityEvaluations.evaluatedAt})`);

    return result.map((row) => ({
      date: row.date,
      avgScore: Number(row.avgScore),
      evaluationCount: Number(row.evaluationCount),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate quality trends report: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// VIOLATION REPORTS
// ============================================================================

/**
 * Get keyword violation report
 */
export async function getKeywordViolationReport(
  startDate: Date,
  endDate: Date
) {
  try {
    const result = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        violationCount: sql<number>`cast(COUNT(*) as integer)`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(
        and(
          eq(entries.containsUnwantedKeywords, true),
          gte(entries.entryTime, startDate),
          lte(entries.entryTime, endDate)
        )
      )
      .groupBy(entries.employeeId, users.fullName)
      .orderBy(desc(sql`COUNT(*)`));

    return result.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      violationCount: Number(row.violationCount),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate keyword violation report: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// ENTRY TYPE ANALYTICS
// ============================================================================

/**
 * Get entry type analytics
 */
export async function getEntryTypeAnalytics(startDate: Date, endDate: Date) {
  try {
    const result = await db
      .select({
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        totalEntries: sql<number>`cast(COUNT(${entries.id}) as integer)`,
        avgQualityScore: sql<number>`AVG(${qualityEvaluations.totalScore})`,
      })
      .from(entries)
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
      .where(
        and(gte(entries.entryTime, startDate), lte(entries.entryTime, endDate))
      )
      .groupBy(entries.entryTypeId, entryTypes.name)
      .orderBy(desc(sql`COUNT(${entries.id})`));

    return result.map((row) => ({
      entryTypeId: row.entryTypeId,
      entryTypeName: row.entryTypeName,
      totalEntries: Number(row.totalEntries),
      avgQualityScore: row.avgQualityScore ? Number(row.avgQualityScore) : null,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate entry type analytics: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// EVALUATOR REPORTS
// ============================================================================

/**
 * Get evaluator report (for team leaders/admins)
 */
export async function getEvaluatorReport(
  evaluatorId: number,
  startDate: Date,
  endDate: Date
) {
  try {
    const result = await db
      .select({
        totalEvaluations: sql<number>`cast(COUNT(*) as integer)`,
        avgScoreGiven: sql<number>`AVG(${qualityEvaluations.totalScore})`,
        highScores: sql<number>`cast(SUM(CASE WHEN ${qualityEvaluations.totalScore} >= 90 THEN 1 ELSE 0 END) as integer)`,
        mediumScores: sql<number>`cast(SUM(CASE WHEN ${qualityEvaluations.totalScore} >= 70 AND ${qualityEvaluations.totalScore} < 90 THEN 1 ELSE 0 END) as integer)`,
        lowScores: sql<number>`cast(SUM(CASE WHEN ${qualityEvaluations.totalScore} < 70 THEN 1 ELSE 0 END) as integer)`,
      })
      .from(qualityEvaluations)
      .where(
        and(
          eq(qualityEvaluations.evaluatorId, evaluatorId),
          gte(qualityEvaluations.evaluatedAt, startDate),
          lte(qualityEvaluations.evaluatedAt, endDate)
        )
      );

    const row = result[0];
    return {
      evaluatorId,
      period: { start: startDate, end: endDate },
      totalEvaluations: Number(row.totalEvaluations || 0),
      avgScoreGiven: Number(row.avgScoreGiven || 0),
      scoreDistribution: {
        high: Number(row.highScores || 0),
        medium: Number(row.mediumScores || 0),
        low: Number(row.lowScores || 0),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate evaluator report: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// COMPARATIVE REPORTS
// ============================================================================

/**
 * Get top performers
 */
export async function getTopPerformers(
  startDate: Date,
  endDate: Date,
  limit: number = 10
) {
  try {
    const result = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        totalEntries: sql<number>`cast(COUNT(${entries.id}) as integer)`,
        avgScore: sql<number>`AVG(${qualityEvaluations.totalScore})`,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
      .where(
        and(gte(entries.entryTime, startDate), lte(entries.entryTime, endDate))
      )
      .groupBy(entries.employeeId, users.fullName)
      .orderBy(desc(sql`AVG(${qualityEvaluations.totalScore})`))
      .limit(limit);

    return result.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      totalEntries: Number(row.totalEntries),
      avgScore: row.avgScore ? Number(row.avgScore) : 0,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get top performers: ${error.message}`);
    }
    throw error;
  }
}
