require("dotenv").config();
const pool = require("./server/db/postgres");

async function seed() {
  const client = await pool.connect();
  try {
    // ── Supermarket ──────────────────────────────────────────────────────
    const supermarket = await client.query(
      "SELECT id FROM categories WHERE name = 'Supermarket'"
    );
    const supermarketId = supermarket.rows[0].id;

    const supermarketSubs = [
      // Drinks
      ["Beer, Wines & Spirits",          "shopping-bag"],
      ["Carbonated Drinks",              "shopping-bag"],
      ["Dairy",                          "shopping-bag"],
      ["Water",                          "shopping-bag"],
      ["Juice & Non Carbonated Drinks",  "shopping-bag"],
      // Household Supplies
      ["Air Fresheners",                 "shopping-bag"],
      ["Bathroom Cleaners",              "shopping-bag"],
      ["Bulb & Batteries",               "shopping-bag"],
      ["Floor Cleaners",                 "shopping-bag"],
      ["Kitchen Cleaners",               "shopping-bag"],
      ["Laundry",                        "shopping-bag"],
      ["Paper & Rolls",                  "shopping-bag"],
      ["Household Cleaners & Sundries",  "shopping-bag"],
    ];

    for (const [name, icon] of supermarketSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, supermarketId]
      );
    }
    console.log("✅ Supermarket subcategories seeded");
    // ── Gaming ──────────────────────────────────────────────────────
    const gaming = await client.query(
      "SELECT id FROM categories WHERE name = 'Gaming'"
    );
    const gamingId = gaming.rows[0].id;

    const gamingSubs = [
      // Playstation
      ["Playstation 5",         "gamepad-2"],
      ["Playstation 4",         "gamepad-2"],
      ["Playstation 3",         "gamepad-2"],
      ["PS Vita",               "gamepad-2"],
      // Nintendo
      ["Nintendo DS",           "gamepad-2"],
      ["Nintendo 3DS",          "gamepad-2"],
      ["Wii",                   "gamepad-2"],
      ["Nintendo Switch",       "gamepad-2"],
      // PC Gaming
      ["Games",                 "gamepad-2"],
    ];

    for (const [name, icon] of gamingSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, gamingId]
      );
    }
    console.log("✅ Gaming subcategories seeded");
    // ── Computing ──────────────────────────────────────────────────────
    const computing = await client.query(
      "SELECT id FROM categories WHERE name = 'Computing'"
    );
    const computingId = computing.rows[0].id;

    const computingSubs = [
      // Laptops
      ["Netbooks",               "laptop"],
      ["Notebooks",                  "laptop"],
      ["Ultrabooks",                      "laptop"],
      // Computer Data Storage
      ["External Hard Drives",                "laptop"],
      ["USB Flash Drives", "laptop"],
      // Laptop Brands
      ["HP Laptops",         "laptop"],
      ["Dell Laptops",           "laptop"],
      ["Lenovo Laptops",              "laptop"],
      ["Apple Laptops",            "laptop"],
      ["Asus Laptops",            "laptop"],
      // Computers & Accessories
      ["Desktops",                  "laptop"],
      ["Monitors",             "laptop"],
      ["Laptop Accessories",            "laptop"],
      ["Scanners",            "laptop"],
      ["Printers",            "laptop"],
      ["Keyboards & Mice",            "laptop"],
      ["Computer Cable",            "laptop"],
      ["Laptop Bags",            "laptop"],
      // Computer Components
      ["Internal Hard Drive",               "laptop"],
      ["Graphic Cards",       "laptop"],
      ["Fans & Cooling",                "laptop"],
      ["CPU Processors",       "laptop"],
      // Refurb Corner
      ["Refurbished Laptops",                      "laptop"],
    ];

    for (const [name, icon] of computingSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, computingId]
      );
    }
    console.log("✅ Computing subcategories seeded");
    // ── Fashion ────────────────────────────────────────────────────────
    const fashion = await client.query(
      "SELECT id FROM categories WHERE name = 'Fashion'"
    );
    const fashionId = fashion.rows[0].id;

    const fashionSubs = [
      // Men's Clothing
      ["Shirts",                       "shirt"],
      ["Suits & Sports Coats",         "shirt"],
      ["Jeans",                        "shirt"],
      ["Underwear",                    "shirt"],
      ["T-Shirts & Tanks",             "shirt"],
      ["Pants",                        "shirt"],
      ["Shorts",                       "shirt"],
      // Women's Clothing
      ["Dresses",                      "shirt"],
      ["Suits & Blazers",              "shirt"],
      ["Tops & Trees",                 "shirt"],
      ["Coats, Jackets & Vests",         "shirt"],
      ["Jumpsuits, Rompers & Overalls",         "shirt"],
      ["Skirts",         "home"],
      ["Lingerie, Sleep & Lounge",         "shirt"],
      ["Jeans",                        "shirt"],
      ["Shorts",                       "shirt"],
      // Kid's Clothing
      ["Boys",                         "shirt"],
      ["Girls",                        "shirt"],
      // Men's Shoes
      ["Fashion Sneakers",             "shirt"],
      ["Loafers & Slip Ons",           "shirt"],
      // Women's Shoes
      ["Flats",                        "shirt"],
      ["Sandals",                      "shirt"],
      // Men's Accessories
      ["Watches",                      "shirt"],
      ["Belts",                        "shirt"],
      // Women's Accessories
      ["Jewerly",                      "shirt"],
      ["Handbangs & Wallets",          "shirt"],
    ]
    for (const [name, icon] of fashionSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, fashionId]
      );
    }
    console.log("✅ Fashion subcategories seeded");
     // ── Home & Office ────────────────────────────────────────────────────────
    const home = await client.query(
      "SELECT id FROM categories WHERE name = 'Home & Office'"
    );
    const homeId = home.rows[0].id;

    const homeSubs = [
      // Kitchen & Dining
      ["Water Dispensers",         "home"],
      ["Kitchen Utensils",         "utensils"],
      ["Cookware",                 "utensils"],
      ["Kitchen Storage",          "home"],
      ["Cutlery",                  "utensils"],
      ["Shelves & Racks",          "home"],
      ["Flasks & Bottles",         "home"],
      // Bedding
      ["Pillows",                  "bed"],
      ["Duvets",                   "bed"],
      ["Mosquito Nets",            "bed"],
      ["Mattresses",               "bed"],
      ["Bedding Accessories",      "bed"],
      ["Sheets & Pillow Cases",    "bed"],
      ["Decorative Pillows",       "bed"],
      // Lighting & Outdoor
      ["Solar Panels",             "plug"],
      ["Portable Power",           "plug"],
      ["Lamps & Shades",           "plug"],
      ["Decorative Lights",        "plug"],
      ["Ceiling Lights",           "plug"],
      ["Outdoor Lighting",         "plug"],
      // Home Decor
      ["Rugs & Carpets",           "home"],
      ["Wall Art",                 "home"],
      ["Door Mats",                "home"],
      ["Artificial Plants",        "flower-2"],
      ["Clocks",                   "clock"],
      ["Mirrors",                  "home"],
      ["Furniture",                "sofa"],
      // Home Organization
      ["Wardrobes",                "home"],
      ["Shoe Racks",               "home"],
      ["Bathroom Storage",         "home"],
      ["Laundry Storage",          "home"],
      ["Racks & Shelves",          "home"],
      ["Baskets, Bins & Containers","home"],
      // Top Brands
      ["Sundabest",                "home"],
      ["Nunix",                    "home"],
      ["Rashnik",                  "home"],
      ["NiceOne",                  "home"],
      ["Ecoa",                     "home"],
      ["Ailyons",                  "home"],
    ];

    for (const [name, icon] of homeSubs) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [name, icon, homeId]
      );
    }
    console.log("✅ Home & Office subcategories seeded");
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
      ["Wall Chargers",              "plug"]
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