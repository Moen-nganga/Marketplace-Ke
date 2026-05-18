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
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id)       REFERENCES users(id)
  );
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM categories").get().n;

if (count === 0) {
  const insert = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
  const cats = [
    ["Electronics",      "💻"],
    ["Vehicles",         "🚗"],
    ["Fashion",          "👗"],
    ["Home & Garden",    "🏠"],
    ["Phones",           "📱"],
    ["Sports & Leisure", "⚽"],
    ["Jobs",             "💼"],
    ["Kids & Baby",      "🍼"],
    ["Animals & Pets",   "🐾"],
    ["Services",         "🔧"],
  ];
  cats.forEach(([name, icon]) => insert.run(name, icon));
  console.log(" Categories seeded");
}

module.exports = db;