const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "marketplace.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    phone       TEXT,
    password    TEXT    NOT NULL,
    avatar      TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    icon  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS listings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    category_id  INTEGER NOT NULL,
    title        TEXT    NOT NULL,
    description  TEXT    NOT NULL,
    price        REAL    NOT NULL,
    condition    TEXT    NOT NULL CHECK(condition IN ('new','used_like_new','used_good','used_fair')),
    location     TEXT    NOT NULL,
    images       TEXT    DEFAULT '[]',
    status       TEXT    DEFAULT 'active' CHECK(status IN ('active','sold','deleted')),
    views        INTEGER DEFAULT 0,
    created_at   TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)     REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS saved_listings (
    user_id    INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    saved_at   TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rater_id    INTEGER NOT NULL,
    rated_id    INTEGER NOT NULL,
    score       INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
    review      TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(rater_id, rated_id),
    FOREIGN KEY (rater_id) REFERENCES users(id),
    FOREIGN KEY (rated_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id     INTEGER NOT NULL,
    user2_id     INTEGER NOT NULL,
    listing_id   INTEGER,
    created_at   TEXT DEFAULT (datetime('now')),
    UNIQUE(user1_id, user2_id, listing_id),
    FOREIGN KEY (user1_id)   REFERENCES users(id),
    FOREIGN KEY (user2_id)   REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id       INTEGER NOT NULL,
    content         TEXT    NOT NULL,
    iv              TEXT    NOT NULL,
    is_read         INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id)       REFERENCES users(id)
 );
`);

// ── Migrations — add columns that may not exist in older DBs ─────────────────
try {
  db.exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
  console.log("✅ Migrated: added is_read to messages");
} catch {
  // Column already exists — safe to ignore
}

try {
  db.exec("ALTER TABLE listings ADD COLUMN reason TEXT");
  console.log("✅ Migrated: added reason to listings");
} catch {
  // already exists
}

try {
  db.exec("ALTER TABLE listings ADD COLUMN tags TEXT DEFAULT '[]'");
  console.log("✅ Migrated: added tags to listings");
} catch {
  // already exists
}

try {
  db.exec("ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)");
  console.log("✅ Migrated: added parent_id to categories");
} catch {
  // already exists
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      listing_id  INTEGER,
      user_id     INTEGER,
      reason      TEXT NOT NULL,
      details     TEXT,
      status      TEXT DEFAULT 'pending',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (listing_id)  REFERENCES listings(id),
      FOREIGN KEY (user_id)     REFERENCES users(id)
    );
  `);
  console.log("✅ Reports table ready");
} catch {
  // already exists
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      type       TEXT    NOT NULL,
      message    TEXT    NOT NULL,
      link       TEXT,
      is_read    INTEGER DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log("✅ Notifications table ready");
} catch {
  // already exists
}

// ── FTS5 full-text search index ───────────────────────────────────────────────
try {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS listings_fts USING fts5(
      title,
      description,
      tags,
      location,
      content='listings',
      content_rowid='id'
    );

    -- Keep FTS index in sync with listings table
    CREATE TRIGGER IF NOT EXISTS listings_ai AFTER INSERT ON listings BEGIN
      INSERT INTO listings_fts(rowid, title, description, tags, location)
      VALUES (new.id, new.title, new.description, new.tags, new.location);
    END;

    CREATE TRIGGER IF NOT EXISTS listings_ad AFTER DELETE ON listings BEGIN
      INSERT INTO listings_fts(listings_fts, rowid, title, description, tags, location)
      VALUES ('delete', old.id, old.title, old.description, old.tags, old.location);
    END;

    CREATE TRIGGER IF NOT EXISTS listings_au AFTER UPDATE ON listings BEGIN
      INSERT INTO listings_fts(listings_fts, rowid, title, description, tags, location)
      VALUES ('delete', old.id, old.title, old.description, old.tags, old.location);
      INSERT INTO listings_fts(rowid, title, description, tags, location)
      VALUES (new.id, new.title, new.description, new.tags, new.location);
    END;
  `);
  console.log("✅ FTS5 search index ready");
} catch (e) {
  console.log("FTS5 already set up:", e.message);
}

// Populate FTS index with existing listings
try {
  const isEmpty = db.prepare("SELECT COUNT(*) AS n FROM listings_fts").get().n === 0;
  if (isEmpty) {
    db.exec(`
      INSERT INTO listings_fts(rowid, title, description, tags, location)
      SELECT id, title, description, COALESCE(tags, '[]'), COALESCE(location, '')
      FROM listings WHERE status != 'deleted'
    `);
    console.log("✅ FTS5 index populated with existing listings");
  }
} catch (e) {
  console.log("FTS5 population skipped:", e.message);
}

const count = db.prepare("SELECT COUNT(*) AS n FROM categories").get().n;

if (count === 0) {
  const insertParent = db.prepare("INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, NULL)");
  const insertChild  = db.prepare("INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, ?)");

  const parents = [
    ["Phones",           "📱"],
    ["Electronics",      "💻"],
    ["Vehicles",         "🚗"],
    ["Fashion",          "👗"],
    ["Home & Garden",    "🏠"],
    ["Sports & Leisure", "⚽"],
    ["Jobs",             "💼"],
    ["Kids & Baby",      "🍼"],
    ["Animals & Pets",   "🐾"],
    ["Services",         "🔧"],
  ];

  const children = {
    "Phones":           [["Mobile Phones","📱"],["Accessories","🎧"],["Smart Watches","⌚"],["Tablets","📟"],["Headphones","🎧"]],
    "Electronics":      [["Laptops","💻"],["Desktops","🖥️"],["Cameras","📷"],["Gaming","🎮"],["TVs","📺"]],
    "Vehicles":         [["Cars","🚗"],["Motorcycles","🏍️"],["Trucks","🚛"],["Spare Parts","🔩"],["Boats","⛵"]],
    "Fashion":          [["Men's Clothing","👔"],["Women's Clothing","👗"],["Shoes","👟"],["Bags","👜"],["Watches","⌚"]],
    "Home & Garden":    [["Furniture","🛋️"],["Kitchen","🍳"],["Garden","🌿"],["Appliances","🏠"],["Bedding","🛏️"]],
    "Sports & Leisure": [["Exercise Equipment","🏋️"],["Outdoor","🏕️"],["Team Sports","⚽"],["Water Sports","🏄"],["Cycling","🚴"]],
    "Jobs":             [["Full Time","💼"],["Part Time","⏰"],["Freelance","💻"],["Internships","🎓"],["Remote","🌍"]],
    "Kids & Baby":      [["Clothes","👶"],["Toys","🧸"],["Feeding","🍼"],["Strollers","🛺"],["Safety","🔒"]],
    "Animals & Pets":   [["Dogs","🐕"],["Cats","🐈"],["Birds","🦜"],["Fish","🐠"],["Pet Supplies","🦴"]],
    "Services":         [["Cleaning","🧹"],["Repairs","🔧"],["Tutoring","📚"],["Beauty","💄"],["Moving","📦"]],
  };

  parents.forEach(([name, icon]) => {
    const { lastInsertRowid: parentId } = insertParent.run(name, icon);
    (children[name] || []).forEach(([cname, cicon]) => {
      insertChild.run(cname, cicon, parentId);
    });
  });

  console.log("✅ Categories seeded with subcategories");
}

module.exports = db;