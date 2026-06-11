require("dotenv").config();
const pool = require("./server/db/postgres");

async function seed() {
  const client = await pool.connect();
  try {
    // ── Phones & Tablets ────────────────────────────────────────────────────
    const phones = await client.query(
      "SELECT id FROM categories WHERE name = 'Phones & Tablets'"
    );
    const phonesId = phones.rows[0].id;

    const phoneSubs = [
      ["Smartphones",                "smartphone"],
      ["iOS Phones",                 "smartphone"],
      ["Feature Phones",             "smartphone"],
      ["Refurbished Phones",         "smartphone"],
      ["Smartphones under 10k",      "smartphone"],
      ["Feature Phones Under 2,000", "smartphone"],
      ["Bluetooth Headsets",         "headphones"],
      ["Smart Watches",              "watch"],
      ["Cases & Sleeves",            "shield"],
      ["Portable Powerbanks",        "battery"],
      ["Batteries & Battery Packs",  "battery"],
      ["Wall Chargers",              "plug"],
      ["Headphones",                 "headphones"],
      ["Tripods",                    "camera"],
      ["Stands",                     "monitor"],
      ["Virtual Reality Headsets",   "gamepad-2"],
      ["Tablets",                    "tablet"],
      ["Tablet Accessories",         "tablet"],
      ["Tablet Bags & Covers",       "shopping-bag"],
      ["Samsung Phones",             "smartphone"],
      ["Xiaomi Phones",              "smartphone"],
      ["Itel Phones",                "smartphone"],
      ["Tecno Phones",               "smartphone"],
      ["Infinix Phones",             "smartphone"],
      ["Huawei Phones",              "smartphone"],
      ["Oppo Phones",                "smartphone"],
      ["Samsung",                    "smartphone"],
      ["Tecno",                      "smartphone"],
      ["Xiaomi",                     "smartphone"],
      ["Infinix",                    "smartphone"],
      ["Oppo",                       "smartphone"],
      ["Vivo",                       "smartphone"],
      ["Itel",                       "smartphone"],
    ];

    for (const [name, icon] of phoneSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, phonesId]
      );
    }
    console.log("✅ Phones & Tablets subcategories seeded");

    // ── TVs & Audio ──────────────────────────────────────────────────────────
    const tvs = await client.query(
      "SELECT id FROM categories WHERE name = 'TVs & Audio'"
    );
    const tvsId = tvs.rows[0].id;

    const tvSubs = [
      // Televisions
      ["Smart TVs",                  "tv"],
      ["Digital TVs",                "tv"],
      ["Data Projectors",            "tv"],
      // Home Audio
      ["Home Theater Systems",       "music"],
      ["Sound Bars",                 "music"],
      ["Bluetooth Speakers",         "music"],
      ["Woofers",                    "music"],
      // Accessories & Supplies
      ["Accessories & Video Supplies","plug"],
      ["TV Stands",                  "monitor"],
      ["Power Protection",           "shield"],
      ["Cables",                     "plug"],
      ["Camera & Photo Accessories", "camera"],
      ["Television Accessories",     "tv"],
      ["TVs Receivers",              "tv"],
      // Cameras
      ["Digital SLR Cameras",        "camera"],
      ["Surveillance Cameras",       "camera"],
      ["Compact Cameras",            "camera"],
      // Best Seller TV Brands
      ["Vitron TV",                  "tv"],
      ["Hikers",                     "tv"],
      ["Skyworth",                   "tv"],
      ["Vision Plus",                "tv"],
      ["HiSense TV",                 "tv"],
      ["Amtec",                      "tv"],
      ["TCL TV",                     "tv"],
      ["Royal",                      "tv"],
      ["GLD",                        "tv"],
    ];

    for (const [name, icon] of tvSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, tvsId]
      );
    }
    console.log("✅ TVs & Audio subcategories seeded");

    // ── Appliances ───────────────────────────────────────────────────────────
    const appliances = await client.query(
      "SELECT id FROM categories WHERE name = 'Appliances'"
    );
    const appliancesId = appliances.rows[0].id;

    const applianceSubs = [
      // Large Appliances
      ["Refrigerators",               "plug"],
      ["Freezers",                    "plug"],
      ["Water Dispensers & Coolers",  "plug"],
      ["Washers & Dryers",            "plug"],
      // Small Appliances
      ["Blenders",                    "plug"],
      ["Toasters",                    "plug"],
      ["Kettles",                     "plug"],
      ["Ironing & Laundry",           "plug"],
      // Cooking Appliances
      ["Cooktops",                    "plug"],
      ["Microwave & Ovens",           "plug"],
      ["Cookers",                     "plug"],
      ["Cooking Appliance Accessories","plug"],
      // Best Seller Brands
      ["LG",                          "plug"],
      ["Midea",                       "plug"],
      ["Ailyons",                     "plug"],
      ["Roch",                        "plug"],
      ["Nunix",                       "plug"],
      ["Hisense",                     "plug"],
      ["Ramtons",                     "plug"],
      ["Von",                         "plug"],
      ["Vitron",                      "plug"],
      ["Skyworth",                    "plug"],
    ];

    for (const [name, icon] of applianceSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, appliancesId]
      );
    }
    console.log("✅ Appliances subcategories seeded");
    // ── Health & Beauty ──────────────────────────────────────────────────────
    const health = await client.query(
      "SELECT id FROM categories WHERE name = 'Health & Beauty'"
    );
    const healthId = health.rows[0].id;

    const healthSubs = [
      // Facial Skincare
      ["Moisturizers",               "heart"],
      ["Cleansers",                  "heart"],
      ["Masks",                      "heart"],
      ["Toners",                     "heart"],
      ["Sun Care",                   "heart"],
      // Hair Care
      ["Conditioner",                "scissors"],
      ["Extensions, Wigs & Accessories", "scissors"],
      ["Shampoos",                   "scissors"],
      ["Conditioners",               "scissors"],
      ["Extension wigs & Accessories","scissors"],
      ["Hair tools",                 "scissors"],
      ["Hair Loss Products",         "scissors"],
      ["Hair Styling Products",      "scissors"],
      // Makeup
      ["Face",                       "sparkles"],
      ["Eyes",                       "sparkles"],
      ["Lips",                       "sparkles"],
      ["Tools & Brushes",            "sparkles"],
      ["Makeup Kits & Combos",       "sparkles"],
      // Health & Wellness
      ["Health Supplements",         "heart"],
      ["Sports nutrition",           "heart"],
      ["Feminine care",              "heart"],
      ["Sexual Wellness",            "heart"],
      // Dermacosmetics
      ["Skin Care",                  "heart"],
      ["Hair Treatment",             "heart"],
      // Personal Care
      ["Body Lotions",               "heart"],
      ["Roll-ons & Deodrants",       "heart"],
      ["Shower Gels",                "heart"],
      ["Shave & Hair Removal",       "scissors"],
      // Fragrances
      ["Men's",                      "sparkles"],
      ["Women's",                    "sparkles"],
      ["Gift sets & combos",         "sparkles"],
      ["Aroma Therapy",              "sparkles"],
      // Luxury Beauty
      ["Fragrances",                 "sparkles"],
      ["Skincare",                   "heart"],
      ["Makeup",                     "sparkles"],
    ];

    for (const [name, icon] of healthSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, healthId]
      );
    }
    console.log("✅ Health & Beauty subcategories seeded");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();