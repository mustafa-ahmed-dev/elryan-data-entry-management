/**
 * Rule Types API
 *
 * API functions for managing rule type lookup table
 */

import { db } from "@/db";
import { ruleTypes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export interface CreateRuleTypeInput {
  name: string;
  displayName: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateRuleTypeInput {
  name?: string;
  displayName?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Get all rule types (active only by default)
 */
export async function getRuleTypes(includeInactive = false) {
  const query = db
    .select()
    .from(ruleTypes)
    .orderBy(asc(ruleTypes.sortOrder), asc(ruleTypes.displayName));

  if (!includeInactive) {
    query.where(eq(ruleTypes.isActive, true));
  }

  return await query;
}

/**
 * Get rule type by ID
 */
export async function getRuleTypeById(id: number) {
  const result = await db
    .select()
    .from(ruleTypes)
    .where(eq(ruleTypes.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get rule type by name
 */
export async function getRuleTypeByName(name: string) {
  const result = await db
    .select()
    .from(ruleTypes)
    .where(eq(ruleTypes.name, name))
    .limit(1);

  return result[0] || null;
}

/**
 * Create new rule type
 */
export async function createRuleType(data: CreateRuleTypeInput) {
  // Check for duplicate name
  const existing = await getRuleTypeByName(data.name);
  if (existing) {
    throw new Error("Rule type with this name already exists");
  }

  const result = await db
    .insert(ruleTypes)
    .values({
      name: data.name,
      displayName: data.displayName,
      icon: data.icon,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    })
    .returning();

  return result[0];
}

/**
 * Update rule type
 */
export async function updateRuleType(id: number, data: UpdateRuleTypeInput) {
  // If updating name, check for duplicates
  if (data.name) {
    const existing = await getRuleTypeByName(data.name);
    if (existing && existing.id !== id) {
      throw new Error("Rule type with this name already exists");
    }
  }

  const result = await db
    .update(ruleTypes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(ruleTypes.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error("Rule type not found");
  }

  return result[0];
}

/**
 * Delete rule type (soft delete - set isActive to false)
 */
export async function deleteRuleType(id: number) {
  // Check if rule type is in use
  // This would require querying evaluation_rules table
  // For now, we'll just soft delete

  const result = await db
    .update(ruleTypes)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(ruleTypes.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error("Rule type not found");
  }

  return result[0];
}

/**
 * Reactivate rule type
 */
export async function reactivateRuleType(id: number) {
  const result = await db
    .update(ruleTypes)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(ruleTypes.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error("Rule type not found");
  }

  return result[0];
}
