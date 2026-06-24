require("dotenv").config();
const pool = require("./server/db/postgres");

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token_expires TIMESTAMP;
    `);
    console.log("Verification columns added");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();