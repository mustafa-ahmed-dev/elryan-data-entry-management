import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, users, entryTypes } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  requireAuth,
  getUserId,
  getTeamId,
  isAdmin,
} from "@/lib/middleware/auth";
import {
  handleApiError,
  paginatedResponse,
  createdResponse,
  parseBody,
  getOffset,
  parseQueryParams,
} from "@/lib/api/utils";
import {
  createEntrySchema,
  entryFilterSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/entries - List entries with filters
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Validate and parse query parameters
    const filters = entryFilterSchema.parse(params);
    const { page, limit, employeeId, entryTypeId, teamId, startDate, endDate } =
      filters;

    // Build query conditions
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(entries.employeeId, employeeId));
    }

    if (entryTypeId) {
      conditions.push(eq(entries.entryTypeId, entryTypeId));
    }

    if (startDate) {
      conditions.push(gte(entries.entryTime, new Date(startDate)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(entries.entryTime, endDateTime));
    }

    // Filter by team if specified
    if (teamId) {
      conditions.push(eq(users.teamId, teamId));
    }

    // Employees can only see their own entries
    if (session.user.role === "employee") {
      conditions.push(eq(entries.employeeId, getUserId(session)));
    }
    // Team leaders can only see their team's entries
    else if (session.user.role === "team_leader") {
      const userTeamId = getTeamId(session);
      if (userTeamId) {
        conditions.push(eq(users.teamId, userTeamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    // Get paginated entries
    const entriesList = await db
      .select({
        id: entries.id,
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        productName: entries.productName,
        productDescription: entries.productDescription,
        followsNamingConvention: entries.followsNamingConvention,
        followsSpecificationOrder: entries.followsSpecificationOrder,
        containsUnwantedKeywords: entries.containsUnwantedKeywords,
        entryTime: entries.entryTime,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(whereClause)
      .orderBy(desc(entries.entryTime))
      .limit(limit)
      .offset(getOffset(page, limit));

    return paginatedResponse(entriesList, page, limit, count);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/entries - Create new entry
 * Requires: authenticated (employees create their own)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await parseBody(request);

    // Validate request body
    const validatedData = createEntrySchema.parse(body);

    // Check if entry type exists
    const [entryType] = await db
      .select()
      .from(entryTypes)
      .where(eq(entryTypes.id, validatedData.entryTypeId))
      .limit(1);

    if (!entryType) {
      throw new Error("Entry type not found");
    }

    // Create entry (always for the authenticated user unless admin)
    const employeeId =
      isAdmin(session) && body.employeeId
        ? body.employeeId
        : getUserId(session);

    const [newEntry] = await db
      .insert(entries)
      .values({
        employeeId,
        entryTypeId: validatedData.entryTypeId,
        productName: validatedData.productName,
        productDescription: validatedData.productDescription,
        followsNamingConvention: validatedData.followsNamingConvention,
        followsSpecificationOrder: validatedData.followsSpecificationOrder,
        containsUnwantedKeywords: validatedData.containsUnwantedKeywords,
      })
      .returning();

    return createdResponse(newEntry, "Entry created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
