import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    teamId: string | null;
  };
}

/**
 * Get the authenticated user session
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized - Please login");
  }

  return session as AuthSession;
}

/**
 * Check if user has required role(s)
 */
export function hasRole(
  session: AuthSession,
  roles: string | string[]
): boolean {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(session.user.role);
}

/**
 * Require user to have specific role(s)
 * Throws error if user doesn't have required role
 */
export async function requireRole(
  roles: string | string[]
): Promise<AuthSession> {
  const session = await requireAuth();

  if (!hasRole(session, roles)) {
    throw new Error("Forbidden - Insufficient permissions");
  }

  return session;
}

/**
 * Check if user is admin
 */
export function isAdmin(session: AuthSession): boolean {
  return session.user.role === "admin";
}

/**
 * Check if user is team leader
 */
export function isTeamLeader(session: AuthSession): boolean {
  return session.user.role === "team_leader";
}

/**
 * Check if user is employee
 */
export function isEmployee(session: AuthSession): boolean {
  return session.user.role === "employee";
}

/**
 * Check if user can manage team (admin or team leader)
 */
export function canManageTeam(session: AuthSession): boolean {
  return isAdmin(session) || isTeamLeader(session);
}

/**
 * Check if user belongs to specific team
 */
export function isInTeam(session: AuthSession, teamId: number): boolean {
  return session.user.teamId === teamId.toString();
}

/**
 * Get user ID as number
 */
export function getUserId(session: AuthSession): number {
  return parseInt(session.user.id);
}

/**
 * Get team ID as number (null if no team)
 */
export function getTeamId(session: AuthSession): number | null {
  return session.user.teamId ? parseInt(session.user.teamId) : null;
}

/**
 * Middleware to handle auth errors and return proper responses
 */
export async function withAuth(
  handler: (session: AuthSession, req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    const session = await requireAuth();
    return await handler(session, req);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Middleware to require specific role(s)
 */
export async function withRole(
  roles: string | string[],
  handler: (session: AuthSession, req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    const session = await requireRole(roles);
    return await handler(session, req);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
