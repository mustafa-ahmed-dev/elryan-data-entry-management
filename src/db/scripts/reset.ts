import { db, pool } from "../index";
import { sql } from "drizzle-orm";

/**
 * Reset the database by dropping all tables
 * WARNING: This will delete ALL data!
 */
async function resetDatabase() {
  console.log("⚠️  WARNING: This will delete ALL data in the database!");
  console.log("Starting database reset in 3 seconds...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    console.log("Dropping all tables...");

    // Drop tables in reverse order of dependencies
    await db.execute(sql`DROP TABLE IF EXISTS quality_evaluations CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS entries CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS evaluation_rules CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS evaluation_rule_sets CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS schedule_history CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS weekly_schedules CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS teams CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS entry_types CASCADE`);

    console.log("✅ All tables dropped successfully");
    console.log("");
    console.log("Next steps:");
    console.log("1. Run: npm run db:push       (to create tables)");
    console.log("2. Run: npm run db:seed       (to populate data)");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log("Reset completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Reset failed:", error);
      process.exit(1);
    });
}

export { resetDatabase };
