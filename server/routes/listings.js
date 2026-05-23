const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const db       = require("../db/database");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/uploads");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories").all());
});

router.get("/", optionalAuth, (req, res) => {
  const {
    q, category_id, min_price, max_price, condition,
    location, sort = "newest", page = 1,
  } = req.query;

  const PAGE_SIZE = 20;
  const offset    = (parseInt(page) - 1) * PAGE_SIZE;
  let where  = ["l.status = 'active'"];
  let params = [];

  if (q)           { where.push("(l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (category_id) { where.push("l.category_id = ?"); params.push(category_id); }
  if (min_price)   { where.push("l.price >= ?");       params.push(min_price); }
  if (max_price)   { where.push("l.price <= ?");       params.push(max_price); }
  if (condition)   { where.push("l.condition = ?");    params.push(condition); }
  if (location)    { where.push("l.location LIKE ?");  params.push(`%${location}%`); }

  const orderMap = {
    newest:     "l.created_at DESC",
    oldest:     "l.created_at ASC",
    price_asc:  "l.price ASC",
    price_desc: "l.price DESC",
    popular:    "l.views DESC",
  };
  const order    = orderMap[sort] || orderMap.newest;
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM listings l ${whereSQL}`)
    .get(...params).n;

  const listings = db
    .prepare(`
      SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
             c.name AS category_name, c.icon AS category_icon
      FROM   listings l
      JOIN   users      u ON u.id = l.user_id
      JOIN   categories c ON c.id = l.category_id
      ${whereSQL}
      ORDER  BY ${order}
      LIMIT  ? OFFSET ?
    `)
    .all(...params, PAGE_SIZE, offset)
    .map(row => ({ ...row, images: JSON.parse(row.images || "[]"), tags: JSON.parse(row.tags || "[]") }));

  res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / PAGE_SIZE) });
});

router.get("/user/:userId", (req, res) => {
  const listings = db
    .prepare(`
      SELECT l.*, c.name AS category_name, c.icon AS category_icon
      FROM   listings l
      JOIN   categories c ON c.id = l.category_id
      WHERE  l.user_id = ? AND l.status != 'deleted'
      ORDER  BY l.created_at DESC
    `)
    .all(req.params.userId)
    .map(row => ({ ...row, images: JSON.parse(row.images || "[]"), tags: JSON.parse(row.tags || "[]") }));

  res.json(listings);
});

router.get("/:id", optionalAuth, (req, res) => {
  const listing = db
    .prepare(`
      SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
             u.created_at AS seller_since,
             c.name AS category_name, c.icon AS category_icon
      FROM   listings l
      JOIN   users      u ON u.id = l.user_id
      JOIN   categories c ON c.id = l.category_id
      WHERE  l.id = ? AND l.status != 'deleted'
    `)
    .get(req.params.id);

  if (!listing) return res.status(404).json({ error: "Listing not found" });

  db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(listing.id);
  listing.images = JSON.parse(listing.images || "[]");
  listing.tags   = JSON.parse(listing.tags   || "[]");
  res.json(listing);
});

router.post("/", requireAuth, upload.array("images", 6), (req, res) => {
  const { title, description, price, condition, category_id, location } = req.body;

  if (!title || !description || !price || !condition || !category_id || !location)
    return res.status(400).json({ error: "All fields are required" });

  const images = (req.files || []).map(f => `/uploads/${f.filename}`);
  const reason = req.body.reason || null;
  const tags   = req.body.tags   || "[]";
  const result = db
    .prepare(`
      INSERT INTO listings (user_id, category_id, title, description, reason, price, condition, location, images, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(req.user.id, category_id, title, description, reason,
         parseFloat(price), condition, location, JSON.stringify(images), tags);

  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(result.lastInsertRowid);
  listing.images = JSON.parse(listing.images);
  res.status(201).json(listing);
});

router.patch("/:id", requireAuth, (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing)                        return res.status(404).json({ error: "Not found" });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { title, description, price, condition, location, status } = req.body;
  const { tags, images, reason } = req.body;
  db.prepare(`
    UPDATE listings
    SET title       = COALESCE(?, title),
        description = COALESCE(?, description),
        price       = COALESCE(?, price),
        condition   = COALESCE(?, condition),
        location    = COALESCE(?, location),
        status      = COALESCE(?, status),
        reason      = COALESCE(?, reason),
        tags        = COALESCE(?, tags),
        images      = COALESCE(?, images),
        category_id = COALESCE(?, category_id)
    WHERE id = ?
  `).run(
    title, description, price ? parseFloat(price) : null,
    condition, location, status, reason || null,
    tags || null, images || null,
    req.body.category_id || null,
    listing.id
  );

  const updated = db.prepare("SELECT * FROM listings WHERE id = ?").get(listing.id);
  updated.images = JSON.parse(updated.images);
  res.json(updated);
});

router.delete("/:id", requireAuth, (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing)                        return res.status(404).json({ error: "Not found" });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("UPDATE listings SET status = 'deleted' WHERE id = ?").run(listing.id);
  res.json({ success: true });
});

// ── GET /api/listings/search/users — search users by name ───────────────────
router.get("/search/users", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const users = db.prepare(`
    SELECT
      u.id, u.name, u.created_at,
      COUNT(l.id) AS listing_count,
      (SELECT ROUND(AVG(score), 1) FROM ratings WHERE rated_id = u.id) AS avg_rating,
      (SELECT COUNT(*) FROM ratings WHERE rated_id = u.id) AS rating_count
    FROM users u
    LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'active'
    WHERE u.name LIKE ?
    GROUP BY u.id
    ORDER BY listing_count DESC
    LIMIT 10
  `).all(`%${q}%`);

  res.json(users);
});

// ── GET /api/listings/tags/suggest?q= — autocomplete tag suggestions ─────────
router.get("/tags/suggest", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 1) return res.json([]);

  const rows = db.prepare(`
    SELECT tags FROM listings
    WHERE tags != '[]' AND status = 'active'
  `).all();

  // Flatten all tags, filter by query, deduplicate, sort by frequency
  const freq = {};
  rows.forEach(row => {
    try {
      JSON.parse(row.tags).forEach(tag => {
        if (tag.toLowerCase().includes(q.toLowerCase())) {
          freq[tag] = (freq[tag] || 0) + 1;
        }
      });
    } catch {}
  });

  const suggestions = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  res.json(suggestions);
});

module.exports = router;