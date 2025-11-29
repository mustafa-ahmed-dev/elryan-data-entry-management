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
  role: varchar("role", { length: 50 }).notNull(),
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
 * Evaluation Rule Sets - Versioned sets of quality rules
 */
export const evaluationRuleSets = pgTable("evaluation_rule_sets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false).notNull(),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Evaluation Rules - Individual quality check rules
 */
export const evaluationRules = pgTable("evaluation_rules", {
  id: serial("id").primaryKey(),
  ruleSetId: integer("rule_set_id")
    .references(() => evaluationRuleSets.id)
    .notNull(),
  ruleName: varchar("rule_name", { length: 200 }).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // 'naming', 'specification', 'keyword', 'completeness', 'accuracy'
  deductionPoints: integer("deduction_points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ENTRIES (Main Data Entry Records)
// ============================================================================

/**
 * Entries - Data entry records submitted by employees
 * Simplified: boolean flags instead of reference tables
 * Timestamp-only tracking for productivity analysis
 */
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .references(() => users.id)
    .notNull(),
  entryTypeId: integer("entry_type_id")
    .references(() => entryTypes.id)
    .notNull(),
  productName: varchar("product_name", { length: 500 }).notNull(),
  productDescription: text("product_description"),

  // Simplified boolean flags (evaluator determines)
  followsNamingConvention: boolean("follows_naming_convention")
    .default(true)
    .notNull(),
  followsSpecificationOrder: boolean("follows_specification_order")
    .default(true)
    .notNull(),
  containsUnwantedKeywords: boolean("contains_unwanted_keywords")
    .default(false)
    .notNull(),

  // Timestamp-only tracking (best practice)
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

// Teams Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
}));

// Users Relations
export const usersRelations = relations(users, ({ one, many }) => ({
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

// Evaluation Rules Relations
export const evaluationRulesRelations = relations(
  evaluationRules,
  ({ one }) => ({
    ruleSet: one(evaluationRuleSets, {
      fields: [evaluationRules.ruleSetId],
      references: [evaluationRuleSets.id],
    }),
  })
);

// Entries Relations
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

// Quality Evaluations Relations
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
