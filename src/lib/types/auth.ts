/**
 * Authentication and Authorization Types
 * Enhanced with Security & Permissions types
 */

// ============================================================================
// EXISTING USER & SESSION TYPES
// ============================================================================

export interface User {
  id: number;
  email: string;
  fullName: string;
  roleId: number;
  roleName: string;
  teamId: number | null;
  isActive: boolean;
}

export interface Session {
  user: User;
  expires: string;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  hierarchy: number;
  isActive: boolean;
  createdAt: Date;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface Permission {
  id: number;
  roleId: number;
  resourceId: number;
  actionId: number;
  scope: PermissionScope;
  conditions?: PermissionConditions;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PermissionScope = "own" | "team" | "all";

export interface PermissionConditions {
  teamId?: number;
  departmentId?: number;
  customRules?: Record<string, any>;
}

export interface UserPermission {
  resource: string;
  action: string;
  scope: PermissionScope;
  conditions?: PermissionConditions;
}

export interface UserPermissions {
  userId: number;
  roleId: number;
  roleName: string;
  roleHierarchy: number;
  teamId: number | null;
  permissions: UserPermission[];
}

// ============================================================================
// PERMISSION MATRIX TYPES
// ============================================================================

export interface PermissionMatrix {
  roles: RoleInfo[];
  resources: ResourceInfo[];
  actions: ActionInfo[];
  permissions: PermissionCell[];
}

export interface RoleInfo {
  id: number;
  name: string;
  displayName: string;
  hierarchy: number;
  permissionCount?: number;
  userCount?: number;
}

export interface ResourceInfo {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

export interface ActionInfo {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

export interface PermissionCell {
  roleId: number;
  resourceId: number;
  actionId: number;
  granted: boolean;
  scope: PermissionScope;
  permissionId: number | null;
}

export interface PermissionUpdate {
  resourceId: number;
  actionId: number;
  granted: boolean;
  scope: PermissionScope;
}

export interface BulkPermissionUpdate {
  roleId: number;
  updates: PermissionUpdate[];
}

// ============================================================================
// SECURITY SETTINGS TYPES
// ============================================================================

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionSettings: SessionSettings;
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  lastUpdatedBy?: number;
  lastUpdatedAt?: Date;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
  preventReuse: number;
}

export interface SessionSettings {
  timeoutMinutes: number;
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface PermissionAuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceAction: string;
  roleId?: number;
  roleName?: string;
  targetUserId?: number;
  targetUserName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuditAction =
  | "granted"
  | "revoked"
  | "updated"
  | "created"
  | "deleted";

export interface AuditLogFilters {
  userId?: number;
  roleId?: number;
  action?: AuditAction;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// LOGIN ATTEMPT TYPES
// ============================================================================

export interface LoginAttempt {
  id: number;
  userId?: number;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: LoginFailureReason;
  timestamp: Date;
  location?: string;
}

export type LoginFailureReason =
  | "invalid_credentials"
  | "account_locked"
  | "account_inactive"
  | "ip_blocked"
  | "too_many_attempts";

export interface LoginAttemptFilters {
  userId?: number;
  email?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface PermissionStatistics {
  totalPermissions: number;
  totalRoles: number;
  totalResources: number;
  totalActions: number;
  permissionsByRole: Record<string, number>;
  permissionsByResource: Record<string, number>;
}

export interface SecurityStatistics {
  totalLoginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  lockedAccounts: number;
  uniqueIpAddresses: number;
  activeIpWhitelist: number;
  recentFailedAttempts: number;
  averageLoginTime?: number;
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

export interface PermissionFormData {
  roleId: number;
  resourceId: number;
  actionId: number;
  scope: PermissionScope;
  conditions?: PermissionConditions;
}

export interface SecuritySettingsFormData {
  passwordPolicy?: Partial<PasswordPolicy>;
  sessionSettings?: Partial<SessionSettings>;
  twoFactorEnabled?: boolean;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
}

export interface IpWhitelistFormData {
  ipAddress: string;
  description?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PermissionMatrixResponse {
  success: boolean;
  data: PermissionMatrix;
  timestamp: Date;
}

export interface SecuritySettingsResponse {
  success: boolean;
  data: SecuritySettings;
  timestamp: Date;
}

export interface PermissionUpdateResponse {
  success: boolean;
  updated: number;
  errors: string[];
  timestamp: Date;
}

export interface AuditLogResponse {
  success: boolean;
  data: PermissionAuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginAttemptsResponse {
  success: boolean;
  data: LoginAttempt[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    permissions: PermissionStatistics;
    security: SecurityStatistics;
  };
  timestamp: Date;
}

// ============================================================================
// ROLE HIERARCHY TYPES
// ============================================================================

export interface RoleHierarchyNode {
  id: number;
  name: string;
  displayName: string;
  hierarchy: number;
  userCount: number;
  permissionCount: number;
  children?: RoleHierarchyNode[];
}

// ============================================================================
// PERMISSION CHECK TYPES
// ============================================================================

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: PermissionScope;
}

export interface PermissionCheckResult {
  [key: string]: boolean; // Format: "resource:action" => boolean
}

// ============================================================================
// USER OVERRIDE TYPES (for user-specific permissions)
// ============================================================================

export interface UserPermissionOverride {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  permissionId: number;
  resource: string;
  action: string;
  scope: PermissionScope;
  grantedBy: number;
  grantedByName: string;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

export interface UserPermissionOverrideFormData {
  userId: number;
  resourceId: number;
  actionId: number;
  scope: PermissionScope;
  expiresAt?: Date;
  reason?: string;
}

// ============================================================================
// PERMISSION TEMPLATE TYPES (for quick apply)
// ============================================================================

export interface PermissionTemplate {
  id: number;
  name: string;
  description: string;
  permissions: PermissionFormData[];
  createdBy: number;
  createdAt: Date;
  isPublic: boolean;
}

export interface PermissionTemplateFormData {
  name: string;
  description: string;
  permissions: PermissionFormData[];
  isPublic: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface PermissionExportData {
  exportedAt: Date;
  exportedBy: number;
  roles: RoleInfo[];
  permissions: Permission[];
  securitySettings: SecuritySettings;
}

export interface AuditLogExportData {
  exportedAt: Date;
  exportedBy: number;
  filters: AuditLogFilters;
  logs: PermissionAuditLog[];
  totalRecords: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type PermissionKey = `${string}:${string}`; // Format: "resource:action"

export interface PermissionScopeOption {
  value: PermissionScope;
  label: string;
  description: string;
  hierarchy: number;
}

export const PERMISSION_SCOPE_OPTIONS: PermissionScopeOption[] = [
  {
    value: "own",
    label: "Own",
    description: "Can only access their own resources",
    hierarchy: 1,
  },
  {
    value: "team",
    label: "Team",
    description: "Can access resources within their team",
    hierarchy: 2,
  },
  {
    value: "all",
    label: "All",
    description: "Can access all resources system-wide",
    hierarchy: 3,
  },
];

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface PermissionValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SecuritySettingsValidationError {
  field: keyof SecuritySettings | keyof PasswordPolicy | keyof SessionSettings;
  message: string;
  value?: any;
}

/**
 * Action names used throughout the system
 * Based on the actions table in the database
 */
export type ActionName =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "evaluate";

/**
 * Resource names used throughout the system
 * Based on the resources table in the database
 */
export type ResourceName =
  | "users"
  | "teams"
  | "schedules"
  | "entries"
  | "evaluations"
  | "reports"
  | "settings";

/**
 * Helper type for permission checks
 */
export interface PermissionCheckParams {
  action: ActionName;
  resource: ResourceName;
  scope?: PermissionScope;
}
