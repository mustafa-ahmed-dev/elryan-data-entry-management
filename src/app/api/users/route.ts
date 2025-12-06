/**
 * Users API Routes
 * GET /api/users - List users with filters
 * POST /api/users - Create user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getUsers, createUser } from "@/db/utils/users";
import { hash } from "argon2";

// GET /api/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, "users", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get("search") || undefined,
      roleId: searchParams.get("roleId")
        ? parseInt(searchParams.get("roleId")!)
        : undefined,
      teamId: searchParams.get("teamId")
        ? parseInt(searchParams.get("teamId")!)
        : undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
    };

    const result = await getUsers(filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission (admin only)
    const canCreate = await checkPermission(
      session.user.id,
      "users",
      "create",
      "all"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.email || !body.password || !body.roleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(body.password);

    // Create user
    const user = await createUser({
      fullName: body.fullName,
      email: body.email,
      password: passwordHash,
      roleId: body.roleId,
      teamId: body.teamId || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 500 }
    );
  }
}
