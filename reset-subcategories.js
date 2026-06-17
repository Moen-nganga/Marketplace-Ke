require("dotenv").config();
const pool = require("./server/db/postgres");

async function reset() {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM categories WHERE parent_id IS NOT NULL");
    console.log("✅ All subcategories cleared");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

reset();