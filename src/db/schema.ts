import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  boolean,
  decimal,
  pgEnum,
  time,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============= ENUMS =============
export const imageQualityEnum = pgEnum("image_quality", ["good", "bad"]);
export const orderCorrectnessEnum = pgEnum("order_correctness", [
  "correct",
  "incorrect",
]);
export const storageTypeEnum = pgEnum("storage_type", ["local", "gcs"]);

// ============= TEAMS =============
export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    leaderId: integer("leader_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deactivatedAt: timestamp("deactivated_at"),
    createdBy: integer("created_by"),
    updatedBy: integer("updated_by"),
    deactivatedBy: integer("deactivated_by"),
  },
  (table) => ({
    leaderIdx: index("idx_teams_leader").on(table.leaderId),
  })
);

// ============= USERS =============
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    teamId: integer("team_id").references(() => teams.id),
    isTeamLeader: boolean("is_team_leader").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deactivatedAt: timestamp("deactivated_at"),
    createdBy: integer("created_by"),
    updatedBy: integer("updated_by"),
    deactivatedBy: integer("deactivated_by"),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    teamIdx: index("idx_users_team").on(table.teamId),
  })
);

// ============= ENTRY TYPES (Lookup) =============
export const entryTypes = pgTable("entry_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// ============= ENTRIES =============
export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    skuOrBrand: varchar("sku_or_brand", { length: 255 }).notNull(),
    entryTypeId: integer("entry_type_id")
      .references(() => entryTypes.id)
      .notNull(),
    enteredAt: timestamp("entered_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    enteredBy: integer("entered_by")
      .references(() => users.id)
      .notNull(),
    updatedBy: integer("updated_by").references(() => users.id),
  },
  (table) => ({
    enteredByIdx: index("idx_entries_entered_by").on(table.enteredBy),
    entryTypeIdx: index("idx_entries_entry_type").on(table.entryTypeId),
    enteredAtIdx: index("idx_entries_entered_at").on(table.enteredAt),
  })
);

// ============= NAMING ORDER TYPES (Lookup) =============
export const namingOrderTypes = pgTable("naming_order_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// ============= SPECIFICATION ORDER TYPES (Lookup) =============
export const specificationOrderTypes = pgTable("specification_order_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// ============= UNWANTED KEYWORDS (Lookup) =============
export const unwantedKeywords = pgTable("unwanted_keywords", {
  id: serial("id").primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// ============= EVALUATION RULES =============
export const evaluationRules = pgTable("evaluation_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entryTypeId: integer("entry_type_id").references(() => entryTypes.id),
  minSpecificationsCount: integer("min_specifications_count"),
  maxSpecificationsCount: integer("max_specifications_count"),
  requiredNamingOrderId: integer("required_naming_order_id").references(
    () => namingOrderTypes.id
  ),
  requiredSpecificationOrderId: integer(
    "required_specification_order_id"
  ).references(() => specificationOrderTypes.id),
  minImagesCount: integer("min_images_count"),
  maxImagesCount: integer("max_images_count"),
  pointsPerCorrectNaming: decimal("points_per_correct_naming", {
    precision: 10,
    scale: 2,
  }),
  pointsPerCorrectSpecification: decimal("points_per_correct_specification", {
    precision: 10,
    scale: 2,
  }),
  pointsPerGoodImageQuality: decimal("points_per_good_image_quality", {
    precision: 10,
    scale: 2,
  }),
  penaltyPerUnwantedKeyword: decimal("penalty_per_unwanted_keyword", {
    precision: 10,
    scale: 2,
  }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// ============= EVALUATION RULE UNWANTED KEYWORDS (Junction) =============
export const evaluationRuleUnwantedKeywords = pgTable(
  "evaluation_rule_unwanted_keywords",
  {
    id: serial("id").primaryKey(),
    evaluationRuleId: integer("evaluation_rule_id")
      .references(() => evaluationRules.id)
      .notNull(),
    unwantedKeywordId: integer("unwanted_keyword_id")
      .references(() => unwantedKeywords.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ruleIdx: index("idx_eval_rule_keywords_rule").on(table.evaluationRuleId),
    keywordIdx: index("idx_eval_rule_keywords_keyword").on(
      table.unwantedKeywordId
    ),
  })
);

// ============= QUALITY EVALUATIONS =============
export const qualityEvaluations = pgTable(
  "quality_evaluations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    evaluationDate: date("evaluation_date").notNull(),
    entryTypeId: integer("entry_type_id")
      .references(() => entryTypes.id)
      .notNull(),
    evaluationRuleId: integer("evaluation_rule_id")
      .references(() => evaluationRules.id)
      .notNull(),
    sku: varchar("sku", { length: 255 }).notNull(),
    numberOfImages: integer("number_of_images").notNull(),
    imageQuality: imageQualityEnum("image_quality").notNull(),
    numberOfSpecifications: integer("number_of_specifications").notNull(),
    namingOrder: orderCorrectnessEnum("naming_order").notNull(),
    specificationsOrder: orderCorrectnessEnum("specifications_order").notNull(),
    unwantedInformation: text("unwanted_information"),
    notes: text("notes"),
    totalScore: decimal("total_score", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: integer("created_by")
      .references(() => users.id)
      .notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: integer("updated_by").references(() => users.id),
  },
  (table) => ({
    userIdx: index("idx_quality_evaluations_user").on(table.userId),
    dateIdx: index("idx_quality_evaluations_date").on(table.evaluationDate),
    entryTypeIdx: index("idx_quality_evaluations_entry_type").on(
      table.entryTypeId
    ),
    createdByIdx: index("idx_quality_evaluations_created_by").on(
      table.createdBy
    ),
  })
);

// ============= EVALUATION ATTACHMENTS =============
export const evaluationAttachments = pgTable(
  "evaluation_attachments",
  {
    id: serial("id").primaryKey(),
    qualityEvaluationId: integer("quality_evaluation_id")
      .references(() => qualityEvaluations.id)
      .notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    filePath: varchar("file_path", { length: 500 }).notNull(),
    storageType: storageTypeEnum("storage_type").default("local").notNull(),
    gcsBucket: varchar("gcs_bucket", { length: 255 }),
    gcsObjectName: varchar("gcs_object_name", { length: 500 }),
    fileType: varchar("file_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    uploadedBy: integer("uploaded_by")
      .references(() => users.id)
      .notNull(),
  },
  (table) => ({
    evaluationIdx: index("idx_eval_attachments_evaluation").on(
      table.qualityEvaluationId
    ),
  })
);

// ============= SHIFT SCHEDULES =============
export const shiftSchedules = pgTable("shift_schedules", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  shiftStartTime: time("shift_start_time").notNull(),
  shiftEndTime: time("shift_end_time").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// ============= ENTRY TIME LOGS =============
export const entryTimeLogs = pgTable(
  "entry_time_logs",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id")
      .references(() => entries.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    previousEntryId: integer("previous_entry_id").references(() => entries.id),
    timeTakenSeconds: integer("time_taken_seconds").notNull(),
    isFirstOfDay: boolean("is_first_of_day").default(false).notNull(),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    entryDate: date("entry_date").notNull(),
  },
  (table) => ({
    userIdx: index("idx_entry_time_logs_user").on(table.userId),
    dateIdx: index("idx_entry_time_logs_date").on(table.entryDate),
  })
);

// ============= DAILY SUMMARIES =============
export const dailySummaries = pgTable(
  "daily_summaries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    teamId: integer("team_id")
      .references(() => teams.id)
      .notNull(),
    summaryDate: date("summary_date").notNull(),
    entryTypeId: integer("entry_type_id")
      .references(() => entryTypes.id)
      .notNull(),
    totalEntries: integer("total_entries").default(0).notNull(),
    averageTimeSeconds: decimal("average_time_seconds", {
      precision: 10,
      scale: 2,
    }),
    totalEvaluations: integer("total_evaluations").default(0).notNull(),
    averageScore: decimal("average_score", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userTeamDateIdx: index("idx_daily_summaries_user_team_date").on(
      table.userId,
      table.teamId,
      table.summaryDate
    ),
  })
);

// ============= RELATIONS =============
export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
  members: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  entries: many(entries),
  qualityEvaluations: many(qualityEvaluations),
}));

export const entriesRelations = relations(entries, ({ one }) => ({
  entryType: one(entryTypes, {
    fields: [entries.entryTypeId],
    references: [entryTypes.id],
  }),
  enteredByUser: one(users, {
    fields: [entries.enteredBy],
    references: [users.id],
  }),
}));

export const qualityEvaluationsRelations = relations(
  qualityEvaluations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [qualityEvaluations.userId],
      references: [users.id],
    }),
    entryType: one(entryTypes, {
      fields: [qualityEvaluations.entryTypeId],
      references: [entryTypes.id],
    }),
    evaluationRule: one(evaluationRules, {
      fields: [qualityEvaluations.evaluationRuleId],
      references: [evaluationRules.id],
    }),
    attachments: many(evaluationAttachments),
  })
);
