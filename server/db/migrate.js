require("dotenv").config();
const pool = require("./postgres");

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔄 Running migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL UNIQUE,
        phone      TEXT,
        password   TEXT NOT NULL,
        avatar     TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id        SERIAL PRIMARY KEY,
        name      TEXT NOT NULL,
        icon      TEXT NOT NULL,
        parent_id INTEGER REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS listings (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id),
        category_id  INTEGER NOT NULL REFERENCES categories(id),
        title        TEXT NOT NULL,
        description  TEXT NOT NULL,
        reason       TEXT,
        price        DECIMAL NOT NULL,
        condition    TEXT NOT NULL CHECK(condition IN ('new','used_like_new','used_good','used_fair')),
        location     TEXT NOT NULL,
        images       JSONB DEFAULT '[]',
        tags         JSONB DEFAULT '[]',
        status       TEXT DEFAULT 'active' CHECK(status IN ('active','sold','deleted')),
        is_promoted  INTEGER DEFAULT 0,
        promoted_until TIMESTAMP,
        views        INTEGER DEFAULT 0,
        created_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS saved_listings (
        user_id    INTEGER NOT NULL REFERENCES users(id),
        listing_id INTEGER NOT NULL REFERENCES listings(id),
        saved_at   TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, listing_id)
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id         SERIAL PRIMARY KEY,
        rater_id   INTEGER NOT NULL REFERENCES users(id),
        rated_id   INTEGER NOT NULL REFERENCES users(id),
        score      INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
        review     TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(rater_id, rated_id)
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id         SERIAL PRIMARY KEY,
        user1_id   INTEGER NOT NULL REFERENCES users(id),
        user2_id   INTEGER NOT NULL REFERENCES users(id),
        listing_id INTEGER REFERENCES listings(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user1_id, user2_id, listing_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        sender_id       INTEGER NOT NULL REFERENCES users(id),
        content         TEXT NOT NULL,
        iv              TEXT NOT NULL,
        is_read         INTEGER DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reports (
        id          SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id),
        listing_id  INTEGER REFERENCES listings(id),
        user_id     INTEGER REFERENCES users(id),
        reason      TEXT NOT NULL,
        details     TEXT,
        status      TEXT DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        type       TEXT NOT NULL,
        message    TEXT NOT NULL,
        link       TEXT,
        is_read    INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        query      TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, query)
      );

      CREATE TABLE IF NOT EXISTS recently_viewed (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        listing_id INTEGER NOT NULL REFERENCES listings(id),
        viewed_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
      );
    `);

    console.log("✅ All tables created");

    // Seed categories
    const { rows } = await client.query("SELECT COUNT(*) FROM categories");
    if (parseInt(rows[0].count) === 0) {
      await seedCategories(client);
    }

    console.log("✅ Migration complete!");
  } catch (e) {
    console.error("❌ Migration failed:", e.message);
  } finally {
    client.release();
    pool.end();
  }
}

async function seedCategories(client) {
  const parents = [
    ["Phones",           "smartphone"],
    ["Electronics",      "laptop"],
    ["Vehicles",         "car"],
    ["Fashion",          "shirt"],
    ["Home & Garden",    "home"],
    ["Sports & Leisure", "trophy"],
    ["Jobs",             "briefcase"],
    ["Kids & Baby",      "baby"],
    ["Animals & Pets",   "paw-print"],
    ["Services",         "wrench"],
  ];

  const children = {
    "Phones":           [["Mobile Phones","smartphone"],["Accessories","headphones"],["Smart Watches","watch"],["Tablets","tablet"],["Headphones","headphones"]],
    "Electronics":      [["Laptops","laptop"],["Desktops","monitor"],["Cameras","camera"],["Gaming","gamepad-2"],["TVs","tv"]],
    "Vehicles":         [["Cars","car"],["Motorcycles","bike"],["Trucks","truck"],["Spare Parts","settings"],["Boats","anchor"]],
    "Fashion":          [["Men's Clothing","shirt"],["Women's Clothing","shirt"],["Shoes","footprints"],["Bags","shopping-bag"],["Watches","watch"]],
    "Home & Garden":    [["Furniture","sofa"],["Kitchen","utensils"],["Garden","flower-2"],["Appliances","plug"],["Bedding","bed"]],
    "Sports & Leisure": [["Exercise Equipment","dumbbell"],["Outdoor","tent"],["Team Sports","trophy"],["Water Sports","waves"],["Cycling","bike"]],
    "Jobs":             [["Full Time","briefcase"],["Part Time","clock"],["Freelance","laptop"],["Internships","graduation-cap"],["Remote","globe"]],
    "Kids & Baby":      [["Clothes","shirt"],["Toys","gamepad-2"],["Feeding","baby"],["Strollers","baby"],["Safety","shield"]],
    "Animals & Pets":   [["Dogs","dog"],["Cats","cat"],["Birds","bird"],["Fish","fish"],["Pet Supplies","bone"]],
    "Services":         [["Cleaning","sparkles"],["Repairs","wrench"],["Tutoring","book-open"],["Beauty","scissors"],["Moving","package"]],
  };

  for (const [name, icon] of parents) {
    const { rows } = await client.query(
      "INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING id",
      [name, icon]
    );
    const parentId = rows[0].id;

    for (const [cname, cicon] of (children[name] || [])) {
      await client.query(
        "INSERT INTO categories (name, icon, parent_id) VALUES ($1, $2, $3)",
        [cname, cicon, parentId]
      );
    }
  }
  console.log("✅ Categories seeded");
}

migrate();