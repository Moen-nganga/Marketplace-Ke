require("dotenv").config();
const pool = require("./server/db/postgres");

async function reset() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Move listings up to their parent category before deleting subcategories
    await client.query(`
      UPDATE listings 
      SET category_id = (
        SELECT parent_id FROM categories WHERE categories.id = listings.category_id
      )
      WHERE category_id IN (
        SELECT id FROM categories WHERE parent_id IS NOT NULL
      )
    `);

    // Now delete all subcategories
    await client.query("DELETE FROM categories WHERE parent_id IS NOT NULL");

    await client.query("COMMIT");
    console.log("✅ All subcategories cleared");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

reset();