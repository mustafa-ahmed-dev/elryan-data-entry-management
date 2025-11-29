import { db } from "./index";
import {
  entryTypes,
  teams,
  users,
  weeklySchedules,
  scheduleHistory,
  evaluationRuleSets,
  evaluationRules,
  entries,
  qualityEvaluations,
} from "./schema";
import argon2 from "argon2";

async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("Clearing existing data...");
    await db.delete(qualityEvaluations);
    await db.delete(entries);
    await db.delete(evaluationRules);
    await db.delete(evaluationRuleSets);
    await db.delete(scheduleHistory);
    await db.delete(weeklySchedules);
    await db.delete(users);
    await db.delete(teams);
    await db.delete(entryTypes);

    // 3. Admin User
    console.log("Creating admin user...");
    const adminPasswordHash = await hashPassword("Elryan@12345");

    const [adminUser] = await db
      .insert(users)
      .values({
        fullName: "Mustafa Ahmed Mohammed",
        email: "mustafa.ahmed@elryan.com",
        passwordHash: adminPasswordHash,
        role: "admin",
        teamId: null,
        isActive: true,
      })
      .returning();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

export { seed };
