import { z } from "zod";

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "team_leader", "employee"]),
  teamId: z.number().int().positive().optional().nullable(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "team_leader", "employee"]).optional(),
  teamId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

// ============================================================================
// SCHEDULE SCHEMAS
// ============================================================================

const scheduleDataSchema = z.object({
  monday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  tuesday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  wednesday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  thursday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  friday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  saturday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
  sunday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isWorking: z.boolean(),
    })
    .optional(),
});

export const createScheduleSchema = z.object({
  userId: z.number().int().positive(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduleData: scheduleDataSchema,
});

export const updateScheduleSchema = z.object({
  scheduleData: scheduleDataSchema,
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export const approveScheduleSchema = z.object({
  reason: z.string().optional(),
});

export const rejectScheduleSchema = z.object({
  reason: z.string().min(5, "Rejection reason is required"),
});

// ============================================================================
// ENTRY SCHEMAS
// ============================================================================

export const createEntrySchema = z.object({
  entryTypeId: z.number().int().positive(),
  productName: z.string().min(1, "Product name is required"),
  productDescription: z.string().optional(),
  followsNamingConvention: z.boolean().default(true),
  followsSpecificationOrder: z.boolean().default(true),
  containsUnwantedKeywords: z.boolean().default(false),
});

export const updateEntrySchema = z.object({
  productName: z.string().min(1).optional(),
  productDescription: z.string().optional(),
  followsNamingConvention: z.boolean().optional(),
  followsSpecificationOrder: z.boolean().optional(),
  containsUnwantedKeywords: z.boolean().optional(),
});

// ============================================================================
// EVALUATION SCHEMAS
// ============================================================================

const violationSchema = z.object({
  ruleId: z.number().int().positive(),
  ruleName: z.string(),
  deduction: z.number().int().min(0),
});

export const createEvaluationSchema = z.object({
  entryId: z.number().int().positive(),
  ruleSetId: z.number().int().positive(),
  totalScore: z.number().int().min(0).max(100),
  violations: z.array(violationSchema),
  comments: z.string().optional(),
});

export const updateEvaluationSchema = z.object({
  totalScore: z.number().int().min(0).max(100).optional(),
  violations: z.array(violationSchema).optional(),
  comments: z.string().optional(),
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.enum(["admin", "team_leader", "employee"]).optional(),
  teamId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const scheduleFilterSchema = paginationSchema.extend({
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending_approval", "approved", "rejected"]).optional(),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const entryFilterSchema = paginationSchema
  .merge(dateRangeSchema)
  .extend({
    employeeId: z.coerce.number().int().positive().optional(),
    entryTypeId: z.coerce.number().int().positive().optional(),
    teamId: z.coerce.number().int().positive().optional(),
  });

export const evaluationFilterSchema = paginationSchema
  .merge(dateRangeSchema)
  .extend({
    employeeId: z.coerce.number().int().positive().optional(),
    evaluatorId: z.coerce.number().int().positive().optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
    maxScore: z.coerce.number().int().min(0).max(100).optional(),
  });
