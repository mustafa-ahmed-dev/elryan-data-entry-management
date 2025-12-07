/**
 * RBAC Seed Script
 * Populates roles, resources, actions, and permissions tables
 *
 * Run with: npm run db:seed:rbac
 */

import { db } from "./index";
import { roles, resources, actions, permissions } from "./schema";

async function seedRBAC() {
  console.log("🌱 Seeding RBAC tables...");

  try {
    // ========================================================================
    // 1. SEED ROLES
    // ========================================================================
    console.log("📝 Seeding roles...");

    const [adminRole] = await db
      .insert(roles)
      .values({
        name: "admin",
        displayName: "Administrator",
        description:
          "Full system access - can manage all users, teams, and data",
        hierarchy: 3,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const [teamLeaderRole] = await db
      .insert(roles)
      .values({
        name: "team_leader",
        displayName: "Team Leader",
        description:
          "Manages team members - can create schedules and evaluate performance",
        hierarchy: 2,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const [employeeRole] = await db
      .insert(roles)
      .values({
        name: "employee",
        displayName: "Employee",
        description:
          "Basic access - can enter data and view personal schedules",
        hierarchy: 1,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Roles seeded:", {
      admin: adminRole?.id,
      team_leader: teamLeaderRole?.id,
      employee: employeeRole?.id,
    });

    // ========================================================================
    // 2. SEED RESOURCES
    // ========================================================================
    console.log("📝 Seeding resources...");

    const resourcesList = [
      { name: "users", displayName: "Users", description: "User management" },
      { name: "teams", displayName: "Teams", description: "Team management" },
      {
        name: "schedules",
        displayName: "Schedules",
        description: "Work schedules",
      },
      { name: "entries", displayName: "Entries", description: "Data entries" },
      {
        name: "evaluations",
        displayName: "Evaluations",
        description: "Quality evaluations",
      },
      {
        name: "reports",
        displayName: "Reports",
        description: "Analytics and reports",
      },
    ];

    const insertedResources = await db
      .insert(resources)
      .values(resourcesList)
      .onConflictDoNothing()
      .returning();

    const resourceMap = Object.fromEntries(
      insertedResources.map((r) => [r.name, r.id])
    );

    console.log("✅ Resources seeded:", resourceMap);

    // ========================================================================
    // 3. SEED ACTIONS
    // ========================================================================
    console.log("📝 Seeding actions...");

    const actionsList = [
      {
        name: "create",
        displayName: "Create",
        description: "Create new records",
      },
      { name: "read", displayName: "Read", description: "View records" },
      { name: "update", displayName: "Update", description: "Edit records" },
      { name: "delete", displayName: "Delete", description: "Remove records" },
      {
        name: "approve",
        displayName: "Approve",
        description: "Approve pending items",
      },
      {
        name: "reject",
        displayName: "Reject",
        description: "Reject pending items",
      },
    ];

    const insertedActions = await db
      .insert(actions)
      .values(actionsList)
      .onConflictDoNothing()
      .returning();

    const actionMap = Object.fromEntries(
      insertedActions.map((a) => [a.name, a.id])
    );

    console.log("✅ Actions seeded:", actionMap);

    // ========================================================================
    // 4. SEED PERMISSIONS
    // ========================================================================
    console.log("📝 Seeding permissions...");

    const permissionsList = [
      // =====================================================================
      // ADMIN PERMISSIONS (Full access to everything)
      // =====================================================================

      // Users - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.create,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.update,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.delete,
        scope: "all",
      },

      // Teams - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.create,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.update,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.delete,
        scope: "all",
      },

      // Schedules - Full CRUD + Approve/Reject
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.create,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.update,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.delete,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.approve,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.reject,
        scope: "all",
      },

      // Entries - Full CRUD (FIXED: Added create and update)
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.create,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.update,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.delete,
        scope: "all",
      },

      // Evaluations - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.create,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.update,
        scope: "all",
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.delete,
        scope: "all",
      },

      // Reports - Read access
      {
        roleId: adminRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "all",
      },

      // =====================================================================
      // TEAM LEADER PERMISSIONS
      // =====================================================================

      // Users - Read team members only
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "team",
      },

      // Teams - Read own team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "own",
      },

      // Schedules - Create for team, read team, update team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.create,
        scope: "team",
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "team",
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.update,
        scope: "team",
      },

      // Entries - Read team entries
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "team",
      },

      // Evaluations - Create/Read/Update for team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.create,
        scope: "team",
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "team",
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.update,
        scope: "team",
      },

      // Reports - Read team reports
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "team",
      },

      // =====================================================================
      // EMPLOYEE PERMISSIONS
      // =====================================================================

      // Users - Read and update own profile
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "own",
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.update,
        scope: "own",
      },

      // Teams - Read own team
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "own",
      },

      // Schedules - Read own schedules
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "own",
      },

      // Entries - Create/Read/Update own entries
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.create,
        scope: "own",
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "own",
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.update,
        scope: "own",
      },

      // Evaluations - Read own evaluations
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "own",
      },

      // Reports - Read own reports
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "own",
      },
    ];

    await db.insert(permissions).values(permissionsList).onConflictDoNothing();

    console.log(`✅ ${permissionsList.length} permissions seeded`);

    console.log("");
    console.log("🎉 RBAC seeding complete!");
    console.log("");
    console.log("📊 Summary:");
    console.log("  - 3 roles created");
    console.log("  - 6 resources created");
    console.log("  - 6 actions created");
    console.log(`  - ${permissionsList.length} permissions created`);
    console.log("");
    console.log("🔐 Permission Breakdown:");
    console.log("  • Admin: Full access to all resources");
    console.log("  • Team Leader: Manage team schedules and evaluations");
    console.log("  • Employee: Manage own entries and view own data");
    console.log("");
  } catch (error) {
    console.error("❌ Error seeding RBAC:", error);
    throw error;
  }
}

// Run the seed function
seedRBAC()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
