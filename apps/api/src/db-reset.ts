/**
 * Database Reset and Seed Script
 *
 * Drops all tables, runs migrations, and seeds test data.
 * Surahs and PointRules are seeded automatically by the app on startup.
 *
 * Usage: pnpm run db:reset
 */

import { execSync } from "child_process";

async function resetDatabase() {
  console.log("\n🔄 Database Reset Script\n");
  console.log("═══════════════════════════════════════════\n");

  try {
    // Step 1: Drop and recreate schema
    console.log("1️⃣  Dropping all tables...");
    execSync(
      'pnpm typeorm query "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"',
      { stdio: "inherit", cwd: __dirname },
    );
    console.log("   ✓ Tables dropped\n");

    // Step 2: Generate Migration
    console.log("2️⃣  Generating initial migration...");
    execSync("pnpm run migration:generate src/migrations/InitialSchema", {
      stdio: "inherit",
      cwd: __dirname,
    });
    console.log("   ✓ Migration generated\n");

    // Step 3: Run migrations
    console.log("3️⃣  Running migrations...");
    execSync("pnpm run migration:run", { stdio: "inherit", cwd: __dirname });
    console.log("   ✓ Migrations complete\n");

    // Step 3: Run seed
    console.log("3️⃣  Seeding database...\n");
    execSync("pnpm run seed", { stdio: "inherit", cwd: __dirname });

    console.log("\n🎉 Database reset complete!");
    console.log(
      "   Now start the app with 'pnpm run dev' to seed Surahs and PointRules.\n",
    );
  } catch (error) {
    console.error("\n❌ Reset failed:", error);
    process.exit(1);
  }
}

resetDatabase();
