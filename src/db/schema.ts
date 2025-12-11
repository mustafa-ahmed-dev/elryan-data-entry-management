import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  json,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// REFERENCE TABLES (Static/Configuration Data)
// ============================================================================

/**
 * Entry Types - Types of data entry operations
 * e.g., "Product Entry", "Brand Entry", "SKU Update"
 */
export const entryTypes = pgTable("entry_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// NEW: RBAC TABLES (Role-Based Access Control)
// ============================================================================

/**
 * Roles - System roles (admin, team_leader, employee)
 * Stored in database for flexibility
 */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  hierarchy: integer("hierarchy").notNull(), // Higher = more power (1=employee, 2=team_leader, 3=admin)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Resources - System resources that can be protected
 * e.g., 'users', 'teams', 'schedules', 'entries', 'evaluations', 'reports'
 */
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Actions - Operations that can be performed
 * e.g., 'create', 'read', 'update', 'delete', 'approve', 'reject'
 */
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Permissions - Maps roles to resource actions
 * Example: role=admin, resource=users, action=delete, scope=all
 */
export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    resourceId: integer("resource_id")
      .references(() => resources.id, { onDelete: "cascade" })
      .notNull(),
    actionId: integer("action_id")
      .references(() => actions.id, { onDelete: "cascade" })
      .notNull(),
    scope: varchar("scope", { length: 20 }).notNull(), // 'own', 'team', 'all'
    conditions: json("conditions").$type<{
      // Optional: Advanced conditions
      teamId?: number;
      departmentId?: number;
      customRules?: Record<string, any>;
    }>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Ensure unique permission combinations
    unique("unique_role_resource_action").on(
      table.roleId,
      table.resourceId,
      table.actionId,
      table.scope
    ),
  ]
);

/**
 * Audit Log - Track permission changes
 */
export const permissionAuditLog = pgTable("permission_audit_log", {
  id: serial("id").primaryKey(),
  permissionId: integer("permission_id").references(() => permissions.id),
  action: varchar("action", { length: 20 }).notNull(), // 'created', 'updated', 'deleted'
  changedBy: integer("changed_by")
    .references(() => users.id)
    .notNull(),
  oldValue: json("old_value"),
  newValue: json("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ORGANIZATIONAL TABLES
// ============================================================================

/**
 * Teams - Data entry teams
 */
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Users - Employees, team leaders, and admins
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id")
    .references(() => roles.id)
    .notNull(), // Changed from varchar to integer
  teamId: integer("team_id").references(() => teams.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Weekly Schedules - Employee work schedules by week
 * Team leaders create, admins approve
 * Once approved, only admins can modify
 */
export const weeklySchedules = pgTable("weekly_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  weekStartDate: date("week_start_date").notNull(), // Monday of the week
  weekEndDate: date("week_end_date").notNull(), // Sunday of the week
  scheduleData: json("schedule_data")
    .$type<{
      monday?: { start: string; end: string; isWorking: boolean };
      tuesday?: { start: string; end: string; isWorking: boolean };
      wednesday?: { start: string; end: string; isWorking: boolean };
      thursday?: { start: string; end: string; isWorking: boolean };
      friday?: { start: string; end: string; isWorking: boolean };
      saturday?: { start: string; end: string; isWorking: boolean };
      sunday?: { start: string; end: string; isWorking: boolean };
    }>()
    .notNull(),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(), // Team leader or admin
  status: varchar("status", { length: 50 })
    .notNull()
    .default("pending_approval"), // 'pending_approval', 'approved', 'rejected'
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved/rejected
  approvalDate: timestamp("approval_date"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Schedule History - Track all changes to schedules
 * For audit trail and accountability
 */
export const scheduleHistory = pgTable("schedule_history", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id")
    .references(() => weeklySchedules.id)
    .notNull(),
  changedBy: integer("changed_by")
    .references(() => users.id)
    .notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'created', 'approved', 'rejected', 'modified'
  oldData: json("old_data"),
  newData: json("new_data"),
  reason: text("reason"),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// ============================================================================
// EVALUATION RULES
// ============================================================================

/**
 * Evaluation Rule Sets
 */
export const evaluationRuleSets = pgTable("evaluation_rule_sets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ruleTypes = pgTable("rule_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }), // Emoji or icon identifier
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Evaluation Rules - Individual quality check rules
 *
 * Each rule belongs to a rule set and defines a specific quality criterion
 */
export const evaluationRules = pgTable("evaluation_rules", {
  id: serial("id").primaryKey(),
  ruleSetId: integer("rule_set_id")
    .references(() => evaluationRuleSets.id)
    .notNull(),
  ruleName: varchar("rule_name", { length: 200 }).notNull(),

  // Reference to rule_types table instead of varchar
  ruleTypeId: integer("rule_type_id")
    .references(() => ruleTypes.id)
    .notNull(),

  // How many points are deducted if this rule is violated
  deductionPoints: integer("deduction_points").notNull(),

  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ENTRIES (Main Data Entry Records)
// ============================================================================

/**
 * Entries - Data entry records submitted by employees
 * These are the records that get evaluated
 */
/**
 * Entries - Simplified data entry records submitted by employees
 * Contains only: SKU, Entry Type, User, and Timestamp
 */
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),

  // User who created the entry
  employeeId: integer("employee_id")
    .references(() => users.id)
    .notNull(),

  // Type of entry
  entryTypeId: integer("entry_type_id")
    .references(() => entryTypes.id)
    .notNull(),

  // SKU field
  sku: varchar("sku", { length: 100 }).notNull(),

  // Timestamp
  entryTime: timestamp("entry_time").defaultNow().notNull(),
});

// ============================================================================
// QUALITY EVALUATIONS
// ============================================================================

/**
 * Quality Evaluations - Quality assessments of entries
 */
export const qualityEvaluations = pgTable("quality_evaluations", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .references(() => entries.id)
    .notNull(),
  evaluatorId: integer("evaluator_id")
    .references(() => users.id)
    .notNull(),
  ruleSetId: integer("rule_set_id")
    .references(() => evaluationRuleSets.id)
    .notNull(),
  totalScore: integer("total_score").notNull(), // Score out of 100
  violations: json("violations").notNull().$type<
    Array<{
      ruleId: number;
      ruleName: string;
      deduction: number;
    }>
  >(),
  comments: text("comments"),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

// Roles Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(permissions),
}));

// Resources Relations
export const resourcesRelations = relations(resources, ({ many }) => ({
  permissions: many(permissions),
}));

// Actions Relations
export const actionsRelations = relations(actions, ({ many }) => ({
  permissions: many(permissions),
}));

// Permissions Relations
export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id],
  }),
  resource: one(resources, {
    fields: [permissions.resourceId],
    references: [resources.id],
  }),
  action: one(actions, {
    fields: [permissions.actionId],
    references: [actions.id],
  }),
  auditLogs: many(permissionAuditLog),
}));

// Teams Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
}));

// Users Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  schedules: many(weeklySchedules, { relationName: "userSchedules" }),
  createdSchedules: many(weeklySchedules, { relationName: "createdSchedules" }),
  approvedSchedules: many(weeklySchedules, {
    relationName: "approvedSchedules",
  }),
  scheduleHistoryChanges: many(scheduleHistory),
  entries: many(entries),
  evaluations: many(qualityEvaluations),
  permissionAudits: many(permissionAuditLog),
}));

// Weekly Schedules Relations
export const weeklySchedulesRelations = relations(
  weeklySchedules,
  ({ one, many }) => ({
    user: one(users, {
      fields: [weeklySchedules.userId],
      references: [users.id],
      relationName: "userSchedules",
    }),
    creator: one(users, {
      fields: [weeklySchedules.createdBy],
      references: [users.id],
      relationName: "createdSchedules",
    }),
    approver: one(users, {
      fields: [weeklySchedules.approvedBy],
      references: [users.id],
      relationName: "approvedSchedules",
    }),
    history: many(scheduleHistory),
  })
);

// Schedule History Relations
export const scheduleHistoryRelations = relations(
  scheduleHistory,
  ({ one }) => ({
    schedule: one(weeklySchedules, {
      fields: [scheduleHistory.scheduleId],
      references: [weeklySchedules.id],
    }),
    changedByUser: one(users, {
      fields: [scheduleHistory.changedBy],
      references: [users.id],
    }),
  })
);

// Entry Types Relations
export const entryTypesRelations = relations(entryTypes, ({ many }) => ({
  entries: many(entries),
}));

// Evaluation Rule Sets Relations
export const evaluationRuleSetsRelations = relations(
  evaluationRuleSets,
  ({ many }) => ({
    rules: many(evaluationRules),
    evaluations: many(qualityEvaluations),
  })
);

/**
 * Evaluation Rules Relations
 */
export const evaluationRulesRelations = relations(
  evaluationRules,
  ({ one }) => ({
    ruleSet: one(evaluationRuleSets, {
      fields: [evaluationRules.ruleSetId],
      references: [evaluationRuleSets.id],
    }),
  })
);

/**
 * Entries Relations
 */
export const entriesRelations = relations(entries, ({ one, many }) => ({
  employee: one(users, {
    fields: [entries.employeeId],
    references: [users.id],
  }),
  entryType: one(entryTypes, {
    fields: [entries.entryTypeId],
    references: [entryTypes.id],
  }),
  evaluations: many(qualityEvaluations),
}));

/**
 * Quality Evaluations Relations
 */
export const qualityEvaluationsRelations = relations(
  qualityEvaluations,
  ({ one }) => ({
    entry: one(entries, {
      fields: [qualityEvaluations.entryId],
      references: [entries.id],
    }),
    evaluator: one(users, {
      fields: [qualityEvaluations.evaluatorId],
      references: [users.id],
    }),
    ruleSet: one(evaluationRuleSets, {
      fields: [qualityEvaluations.ruleSetId],
      references: [evaluationRuleSets.id],
    }),
  })
);

// ============================================================================
// TYPESCRIPT TYPES - Add to the end of src/db/schema.ts
// ============================================================================

// Reference Tables
export type EntryType = typeof entryTypes.$inferSelect;
export type NewEntryType = typeof entryTypes.$inferInsert;

// RBAC Types
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;
export type NewPermissionAuditLog = typeof permissionAuditLog.$inferInsert;

// Organizational Types
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type WeeklySchedule = typeof weeklySchedules.$inferSelect;
export type NewWeeklySchedule = typeof weeklySchedules.$inferInsert;

export type ScheduleHistory = typeof scheduleHistory.$inferSelect;
export type NewScheduleHistory = typeof scheduleHistory.$inferInsert;

// Evaluation System Types (already exist, keeping for completeness)
export type EvaluationRuleSet = typeof evaluationRuleSets.$inferSelect;
export type NewEvaluationRuleSet = typeof evaluationRuleSets.$inferInsert;

export type EvaluationRule = typeof evaluationRules.$inferSelect;
export type NewEvaluationRule = typeof evaluationRules.$inferInsert;

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

export type QualityEvaluation = typeof qualityEvaluations.$inferSelect;
export type NewQualityEvaluation = typeof qualityEvaluations.$inferInsert;

// Custom Types
export type Violation = {
  ruleId: number;
  ruleName: string;
  deduction: number;
};

export type ScheduleData = {
  monday?: { start: string; end: string; isWorking: boolean };
  tuesday?: { start: string; end: string; isWorking: boolean };
  wednesday?: { start: string; end: string; isWorking: boolean };
  thursday?: { start: string; end: string; isWorking: boolean };
  friday?: { start: string; end: string; isWorking: boolean };
  saturday?: { start: string; end: string; isWorking: boolean };
  sunday?: { start: string; end: string; isWorking: boolean };
};

export type DaySchedule = {
  start: string;
  end: string;
  isWorking: boolean;
};

// Permission Conditions Type
export type PermissionConditions = {
  teamId?: number;
  departmentId?: number;
  customRules?: Record<string, any>;
};

// Schedule Status Type
export type ScheduleStatus = "pending_approval" | "approved" | "rejected";

// Schedule Change Type
export type ScheduleChangeType =
  | "created"
  | "approved"
  | "rejected"
  | "modified";

// Permission Scope Type
export type PermissionScope = "own" | "team" | "all";

// Permission Audit Action Type
export type PermissionAuditAction = "created" | "updated" | "deleted";

// Rule Types
export type RuleType =
  | "naming"
  | "specification"
  | "keyword"
  | "completeness"
  | "accuracy";
