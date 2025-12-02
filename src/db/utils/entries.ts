import { db } from "../index";
import { entries, users, entryTypes } from "../schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateEntryInput {
  employeeId: number;
  entryTypeId: number;
  productName: string;
  productDescription?: string;
  followsNamingConvention?: boolean;
  followsSpecificationOrder?: boolean;
  containsUnwantedKeywords?: boolean;
  entryTime?: Date;
}

export interface EntryWithDetails {
  id: number;
  employeeId: number;
  entryTypeId: number;
  productName: string;
  productDescription: string | null;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
  entryTime: Date;
  employee?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  entryType?: {
    id: number;
    name: string;
    description: string | null;
  };
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new entry
 */
export async function createEntry(input: CreateEntryInput) {
  try {
    const [entry] = await db
      .insert(entries)
      .values({
        employeeId: input.employeeId,
        entryTypeId: input.entryTypeId,
        productName: input.productName,
        productDescription: input.productDescription || null,
        followsNamingConvention: input.followsNamingConvention ?? true,
        followsSpecificationOrder: input.followsSpecificationOrder ?? true,
        containsUnwantedKeywords: input.containsUnwantedKeywords ?? false,
        entryTime: input.entryTime || new Date(),
      })
      .returning();

    return entry;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create entry: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Bulk create entries
 */
export async function bulkCreateEntries(inputs: CreateEntryInput[]) {
  try {
    const entriesToInsert = inputs.map((input) => ({
      employeeId: input.employeeId,
      entryTypeId: input.entryTypeId,
      productName: input.productName,
      productDescription: input.productDescription || null,
      followsNamingConvention: input.followsNamingConvention ?? true,
      followsSpecificationOrder: input.followsSpecificationOrder ?? true,
      containsUnwantedKeywords: input.containsUnwantedKeywords ?? false,
      entryTime: input.entryTime || new Date(),
    }));

    return await db.insert(entries).values(entriesToInsert).returning();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to bulk create entries: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// QUERY
// ============================================================================

/**
 * Get entry by ID with full details
 */
export async function getEntryById(
  entryId: number
): Promise<EntryWithDetails | null> {
  try {
    const result = await db
      .select({
        entry: entries,
        employee: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
        entryType: {
          id: entryTypes.id,
          name: entryTypes.name,
          description: entryTypes.description,
        },
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(eq(entries.id, entryId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row.entry,
      employee: row.employee || undefined,
      entryType: row.entryType || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get entry: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get entries with filters
 */
export async function getEntries(filters?: {
  employeeId?: number;
  entryTypeId?: number;
  startDate?: Date;
  endDate?: Date;
  hasViolations?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = db
      .select({
        entry: entries,
        employee: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
        entryType: {
          id: entryTypes.id,
          name: entryTypes.name,
          description: entryTypes.description,
        },
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .$dynamic();

    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(entries.employeeId, filters.employeeId));
    }

    if (filters?.entryTypeId) {
      conditions.push(eq(entries.entryTypeId, filters.entryTypeId));
    }

    if (filters?.startDate) {
      conditions.push(gte(entries.entryTime, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(entries.entryTime, filters.endDate));
    }

    if (filters?.hasViolations) {
      conditions.push(
        sql`(${entries.followsNamingConvention} = false OR ${entries.followsSpecificationOrder} = false OR ${entries.containsUnwantedKeywords} = true)`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(entries.entryTime));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const result = await query;

    return result.map((row) => ({
      ...row.entry,
      employee: row.employee || undefined,
      entryType: row.entryType || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get entries: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get entries by employee
 */
export async function getEntriesByEmployee(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    return await getEntries({ employeeId, startDate, endDate });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get entries by employee: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get entry count by employee
 */
export async function getEntryCountByEmployee(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(entries.entryTime, startDate));
    }

    if (endDate) {
      conditions.push(lte(entries.entryTime, endDate));
    }

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(entries)
      .where(and(...conditions));

    return Number(result[0]?.count || 0);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get entry count: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get hourly entry statistics for an employee
 */
export async function getHourlyEntryStats(employeeId: number, date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${entries.entryTime})`,
        count: sql<number>`cast(count(*) as integer)`,
        violations: sql<number>`cast(sum(case when ${entries.followsNamingConvention} = false OR ${entries.followsSpecificationOrder} = false OR ${entries.containsUnwantedKeywords} = true then 1 else 0 end) as integer)`,
      })
      .from(entries)
      .where(
        and(
          eq(entries.employeeId, employeeId),
          gte(entries.entryTime, startOfDay),
          lte(entries.entryTime, endOfDay)
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${entries.entryTime})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${entries.entryTime})`);

    return result.map((row) => ({
      hour: Number(row.hour),
      count: Number(row.count),
      violations: Number(row.violations),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get hourly entry stats: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get entry type distribution for an employee
 */
export async function getEntryTypeDistribution(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(entries.entryTime, startDate));
    }

    if (endDate) {
      conditions.push(lte(entries.entryTime, endDate));
    }

    const result = await db
      .select({
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(entries)
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(and(...conditions))
      .groupBy(entries.entryTypeId, entryTypes.name)
      .orderBy(desc(sql`count(*)`));

    return result.map((row) => ({
      entryTypeId: row.entryTypeId,
      entryTypeName: row.entryTypeName,
      count: Number(row.count),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to get entry type distribution: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Get violation statistics
 */
export async function getViolationStats(
  employeeId?: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(entries.employeeId, employeeId));
    }

    if (startDate) {
      conditions.push(gte(entries.entryTime, startDate));
    }

    if (endDate) {
      conditions.push(lte(entries.entryTime, endDate));
    }

    const result = await db
      .select({
        totalEntries: sql<number>`cast(count(*) as integer)`,
        namingViolations: sql<number>`cast(sum(case when ${entries.followsNamingConvention} = false then 1 else 0 end) as integer)`,
        specViolations: sql<number>`cast(sum(case when ${entries.followsSpecificationOrder} = false then 1 else 0 end) as integer)`,
        keywordViolations: sql<number>`cast(sum(case when ${entries.containsUnwantedKeywords} = true then 1 else 0 end) as integer)`,
      })
      .from(entries)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const row = result[0];
    return {
      totalEntries: Number(row.totalEntries || 0),
      namingViolations: Number(row.namingViolations || 0),
      specViolations: Number(row.specViolations || 0),
      keywordViolations: Number(row.keywordViolations || 0),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get violation stats: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get average time between entries (in minutes)
 */
export async function getAverageTimeBetweenEntries(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(entries.entryTime, startDate));
    }

    if (endDate) {
      conditions.push(lte(entries.entryTime, endDate));
    }

    const result = await db
      .select({
        avgDiff: sql<number>`AVG(EXTRACT(EPOCH FROM (entry_time - LAG(entry_time) OVER (ORDER BY entry_time))) / 60)`,
      })
      .from(entries)
      .where(and(...conditions));

    return Number(result[0]?.avgDiff || 0);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to get average time between entries: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// UPDATE & DELETE
// ============================================================================

/**
 * Update entry
 */
export async function updateEntry(
  entryId: number,
  updates: Partial<CreateEntryInput>
) {
  try {
    const [updated] = await db
      .update(entries)
      .set(updates)
      .where(eq(entries.id, entryId))
      .returning();

    return updated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update entry: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Delete entry
 */
export async function deleteEntry(entryId: number) {
  try {
    const [deleted] = await db
      .delete(entries)
      .where(eq(entries.id, entryId))
      .returning();

    return deleted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete entry: ${error.message}`);
    }
    throw error;
  }
}
