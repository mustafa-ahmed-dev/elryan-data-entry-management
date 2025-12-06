/**
 * Main Database Seed Script
 * Creates initial data for development/testing
 *
 * Run with: npm run db:seed
 */

import { db } from "./index";
import { users, teams, roles, entryTypes } from "./schema";
import { hash } from "argon2";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // ========================================================================
    // 1. ENSURE RBAC DATA EXISTS
    // ========================================================================
    console.log("📝 Checking RBAC tables...");

    const existingRoles = await db.select().from(roles);

    if (existingRoles.length === 0) {
      console.log("⚠️  RBAC tables are empty!");
      console.log("❌ Please run: npm run db:seed:rbac first");
      process.exit(1);
    }

    // Get role IDs
    const adminRole = existingRoles.find((r) => r.name === "admin");
    const teamLeaderRole = existingRoles.find((r) => r.name === "team_leader");
    const employeeRole = existingRoles.find((r) => r.name === "employee");

    if (!adminRole || !teamLeaderRole || !employeeRole) {
      console.log(
        "❌ Missing required roles. Please run: npm run db:seed:rbac"
      );
      process.exit(1);
    }

    console.log("✅ RBAC roles found:", {
      admin: adminRole.id,
      team_leader: teamLeaderRole.id,
      employee: employeeRole.id,
    });

    // ========================================================================
    // 2. SEED ENTRY TYPES
    // ========================================================================
    console.log("📝 Seeding entry types...");

    const entryTypesList = [
      {
        name: "Product Entry",
        description: "Adding new products to the system",
      },
      {
        name: "Brand Entry",
        description: "Adding new brand information",
      },
      {
        name: "SKU Update",
        description: "Updating existing SKU data",
      },
      {
        name: "Category Assignment",
        description: "Assigning products to categories",
      },
    ];

    await db.insert(entryTypes).values(entryTypesList).onConflictDoNothing();

    console.log(`✅ ${entryTypesList.length} entry types seeded`);

    // ========================================================================
    // 3. SEED TEAMS
    // ========================================================================
    console.log("📝 Seeding teams...");

    const [teamA] = await db
      .insert(teams)
      .values({
        name: "Team Alpha",
        description: "Data entry team for electronics category",
      })
      .onConflictDoNothing()
      .returning();

    const [teamB] = await db
      .insert(teams)
      .values({
        name: "Team Beta",
        description: "Data entry team for fashion category",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Teams seeded:", {
      teamA: teamA?.id,
      teamB: teamB?.id,
    });

    // ========================================================================
    // 4. SEED USERS
    // ========================================================================
    console.log("📝 Seeding users...");

    // Hash passwords
    const adminPassword = await hash("Elryan@12345");

    // Admin user
    const [admin] = await db
      .insert(users)
      .values({
        fullName: "Mustafa Ahmed",
        email: "mustafa.ahmed@elryan.com",
        passwordHash: adminPassword,
        roleId: adminRole.id,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: adminPassword,
          roleId: adminRole.id,
        },
      })
      .returning();

    console.log("✅ Admin user created:", admin.email);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
