import pkg from "pg";

const { Client } = pkg;

// Use the default 'postgres' database to connect initially
const DEFAULT_PG_CONNECTION_STRING = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/\/erp_almubarok$/, "/postgres")
  : "postgresql://postgres:postgres@localhost:5432/postgres";

async function createDatabase() {
  console.log("🔌 Connecting to default postgres database to bootstrap 'erp_almubarok'...");
  const client = new Client({ connectionString: DEFAULT_PG_CONNECTION_STRING });
  await client.connect();

  try {
    // Check if erp_almubarok already exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'erp_almubarok'"
    );

    if (res.rowCount && res.rowCount > 0) {
      console.log("✅ Database 'erp_almubarok' already exists.");
    } else {
      console.log("🆕 Creating database 'erp_almubarok'...");
      await client.query("CREATE DATABASE erp_almubarok");
      console.log("✅ Database 'erp_almubarok' successfully created.");
    }
  } catch (err: any) {
    console.error("❌ Failed to create database:", err.message);
  } finally {
    await client.end();
  }
}

createDatabase();
