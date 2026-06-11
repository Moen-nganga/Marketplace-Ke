require("dotenv").config();
const pool = require("./server/db/postgres");

async function seed() {
  const client = await pool.connect();
  try {
    // Get Phones & Tablets parent ID
    const parent = await client.query(
      "SELECT id FROM categories WHERE name = 'Phones & Tablets'"
    );
    const parentId = parent.rows[0].id;

    const subcategories = [
      // Mobile Phones group
      ["Smartphones",           "smartphone", parentId],
      ["iOS Phones",            "smartphone", parentId],
      ["Feature Phones",        "smartphone", parentId],
      ["Refurbished Phones",    "smartphone", parentId],
      ["Smartphones under 10k", "smartphone", parentId],
      ["Feature Phones Under 2,000", "smartphone", parentId],

      // Accessories group
      ["Bluetooth Headsets",    "headphones",    parentId],
      ["Smart Watches",         "watch",         parentId],
      ["Cases & Sleeves",       "shield",        parentId],
      ["Portable Powerbanks",   "battery",       parentId],
      ["Batteries & Battery Packs", "battery",   parentId],
      ["Wall Chargers",         "plug",          parentId],
      ["Headphones",            "headphones",    parentId],
      ["Tripods",               "camera",        parentId],
      ["Stands",                "monitor",       parentId],
      ["Virtual Reality Headsets", "gamepad-2",  parentId],

      // Tablets group
      ["Tablets",               "tablet",        parentId],
      ["Tablet Accessories",    "tablet",        parentId],
      ["Tablet Bags & Covers",  "shopping-bag",  parentId],

      // Top Smartphone Brands
      ["Samsung Phones",        "smartphone",    parentId],
      ["Xiaomi Phones",         "smartphone",    parentId],
      ["Itel Phones",           "smartphone",    parentId],
      ["Tecno Phones",          "smartphone",    parentId],
      ["Infinix Phones",        "smartphone",    parentId],
      ["Huawei Phones",         "smartphone",    parentId],
      ["Oppo Phones",           "smartphone",    parentId],

      // Best Sellers
      ["Samsung",               "smartphone",    parentId],
      ["Tecno",                 "smartphone",    parentId],
      ["Xiaomi",                "smartphone",    parentId],
      ["Infinix",               "smartphone",    parentId],
      ["Oppo",                  "smartphone",    parentId],
      ["Vivo",                  "smartphone",    parentId],
      ["Itel",                  "smartphone",    parentId],
    ];

    for (const [name, icon, pid] of subcategories) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, pid]
      );
    }

    console.log("✅ Phones & Tablets subcategories seeded!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();