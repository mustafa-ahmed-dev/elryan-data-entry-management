/**
 * Role Constants
 *
 * These match the role names in the database
 * Used for type safety and consistency
 */

// Role type - must match database
export type UserRole = "admin" | "team_leader" | "employee";

// Role constants
export const ROLES = {
  ADMIN: "admin" as const,
  TEAM_LEADER: "team_leader" as const,
  EMPLOYEE: "employee" as const,
} as const;

// Array of all valid roles
export const ALL_ROLES: UserRole[] = [
  ROLES.ADMIN,
  ROLES.TEAM_LEADER,
  ROLES.EMPLOYEE,
];

// Human-readable labels (fallback if not from DB)
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  team_leader: "Team Leader",
  employee: "Employee",
};

// Role hierarchy values (matches database)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  team_leader: 2,
  employee: 1,
};

// Helper functions
export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}

export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}
