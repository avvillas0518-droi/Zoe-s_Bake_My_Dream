import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = "https://gvxhxbqvwbrsovpnhdtk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eGh4YnF2d2Jyc292cG5oZHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDY2NzksImV4cCI6MjA5NTUyMjY3OX0.IPYT1tvAUXePttF7PwARNn50BnQc-XlTbE7A-gs2Q1U";

async function migrate() {
  console.log("🚀 Starting migration from Supabase to Aiven PostgreSQL...");

  // 1. Fetch current data from Supabase REST API
  console.log("📡 Fetching data from Supabase...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(`❌ Supabase fetch failed: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const rows = await response.json();
  if (!rows || rows.length === 0) {
    console.log("⚠️ No data found in Supabase. Nothing to migrate.");
    process.exit(0);
  }

  const state = rows[0];
  console.log(`✅ Fetched app_state row (id=${state.id}) from Supabase`);

  // 2. Connect to Aiven PostgreSQL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  // 3. Create table if not exists
  console.log("🗄️  Ensuring app_state table exists...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Table ready");

  // 4. Insert / upsert the fetched data
  console.log("💾 Inserting data into Aiven PostgreSQL...");
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET data = $3, updated_at = NOW()`,
    [state.id, state.data, state.data]
  );
  console.log("✅ Data migrated successfully!");

  await pool.end();
  console.log("🎉 Migration complete!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
