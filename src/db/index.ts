// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import "dotenv/config"; // 👈 ADD THIS LINE!

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "data_entry_db",
  ssl: false, // Disable SSL for local development
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for manual queries if needed
export { pool };

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Close database connection
export async function closeConnection() {
  await pool.end();
  console.log("Database connection closed");
}
