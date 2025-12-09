/**
 * RBAC Seed Script
 * Populates roles, resources, actions, and permissions tables
 *
 * Run with: npm run db:seed:rbac
 */

import { db } from "./index";
import { roles, resources, actions, permissions } from "./schema";
import { eq } from "drizzle-orm";

async function seedRBAC() {
  console.log("🌱 Seeding RBAC tables...");

  try {
    // ========================================================================
    // 1. SEED ROLES (or get existing)
    // ========================================================================
    console.log("📝 Seeding roles...");

    // Try to insert, but if they exist, query them
    await db
      .insert(roles)
      .values([
        {
          name: "admin",
          displayName: "Administrator",
          description:
            "Full system access - can manage all users, teams, and data",
          hierarchy: 3,
          isActive: true,
        },
        {
          name: "team_leader",
          displayName: "Team Leader",
          description:
            "Manages team members - can create schedules and evaluate performance",
          hierarchy: 2,
          isActive: true,
        },
        {
          name: "employee",
          displayName: "Employee",
          description:
            "Basic access - can enter data and view personal schedules",
          hierarchy: 1,
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    // Now query to get the IDs
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"))
      .limit(1);

    const [teamLeaderRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "team_leader"))
      .limit(1);

    const [employeeRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "employee"))
      .limit(1);

    console.log("✅ Roles ready:", {
      admin: adminRole?.id,
      team_leader: teamLeaderRole?.id,
      employee: employeeRole?.id,
    });

    // ========================================================================
    // 2. SEED RESOURCES (or get existing)
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
      {
        name: "settings",
        displayName: "Settings",
        description: "System settings and permissions",
      },
    ];

    await db.insert(resources).values(resourcesList).onConflictDoNothing();

    // Query to get all resources with their IDs
    const allResources = await db.select().from(resources);
    const resourceMap = Object.fromEntries(
      allResources.map((r) => [r.name, r.id])
    );

    console.log("✅ Resources ready:", resourceMap);

    // ========================================================================
    // 3. SEED ACTIONS (or get existing)
    // ========================================================================
    console.log("📝 Seeding actions...");

    const actionsList = [
      {
        name: "create",
        displayName: "Create",
        description: "Create new items",
      },
      { name: "read", displayName: "Read", description: "View items" },
      { name: "update", displayName: "Update", description: "Modify items" },
      { name: "delete", displayName: "Delete", description: "Remove items" },
      {
        name: "approve",
        displayName: "Approve",
        description: "Approve requests",
      },
      { name: "reject", displayName: "Reject", description: "Reject requests" },
      {
        name: "evaluate",
        displayName: "Evaluate",
        description: "Perform evaluations",
      },
    ];

    await db.insert(actions).values(actionsList).onConflictDoNothing();

    // Query to get all actions with their IDs
    const allActions = await db.select().from(actions);
    const actionMap = Object.fromEntries(allActions.map((a) => [a.name, a.id]));

    console.log("✅ Actions ready:", actionMap);

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
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.delete,
        scope: "all" as const,
      },

      // Teams - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.create,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.delete,
        scope: "all" as const,
      },

      // Schedules - Full CRUD + Approve/Reject
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.create,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.delete,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.approve,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.reject,
        scope: "all" as const,
      },

      // Entries - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.create,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.delete,
        scope: "all" as const,
      },

      // Evaluations - Full CRUD
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.create,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.delete,
        scope: "all" as const,
      },

      // Reports - Read access
      {
        roleId: adminRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "all" as const,
      },

      // Settings - Full CRUD (NEW!)
      {
        roleId: adminRole.id,
        resourceId: resourceMap.settings,
        actionId: actionMap.create,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.settings,
        actionId: actionMap.read,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.settings,
        actionId: actionMap.update,
        scope: "all" as const,
      },
      {
        roleId: adminRole.id,
        resourceId: resourceMap.settings,
        actionId: actionMap.delete,
        scope: "all" as const,
      },

      // =====================================================================
      // TEAM LEADER PERMISSIONS
      // =====================================================================

      // Users - Read team members only
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "team" as const,
      },

      // Teams - Read own team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "own" as const,
      },

      // Schedules - Create for team, read team, update team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.create,
        scope: "team" as const,
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "team" as const,
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.update,
        scope: "team" as const,
      },

      // Entries - Read team entries
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "team" as const,
      },

      // Evaluations - Create/Read/Update for team
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.create,
        scope: "team" as const,
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "team" as const,
      },
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.update,
        scope: "team" as const,
      },

      // Reports - Read team reports
      {
        roleId: teamLeaderRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "team" as const,
      },

      // =====================================================================
      // EMPLOYEE PERMISSIONS
      // =====================================================================

      // Users - Read and update own profile
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.read,
        scope: "own" as const,
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.users,
        actionId: actionMap.update,
        scope: "own" as const,
      },

      // Teams - Read own team
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.teams,
        actionId: actionMap.read,
        scope: "own" as const,
      },

      // Schedules - Read own schedules
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.schedules,
        actionId: actionMap.read,
        scope: "own" as const,
      },

      // Entries - Create/Read/Update own entries
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.create,
        scope: "own" as const,
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.read,
        scope: "own" as const,
      },
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.entries,
        actionId: actionMap.update,
        scope: "own" as const,
      },

      // Evaluations - Read own evaluations
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.evaluations,
        actionId: actionMap.read,
        scope: "own" as const,
      },

      // Reports - Read own reports
      {
        roleId: employeeRole.id,
        resourceId: resourceMap.reports,
        actionId: actionMap.read,
        scope: "own" as const,
      },
    ];

    await db.insert(permissions).values(permissionsList).onConflictDoNothing();

    console.log(`✅ ${permissionsList.length} permissions seeded`);

    console.log("");
    console.log("🎉 RBAC seeding complete!");
    console.log("");
    console.log("📊 Summary:");
    console.log("  - 3 roles created");
    console.log("  - 7 resources created (including settings)");
    console.log("  - 7 actions created");
    console.log(`  - ${permissionsList.length} permissions created`);
    console.log("");
    console.log("🔐 Permission Breakdown:");
    console.log("  • Admin: Full access to all resources + settings");
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
