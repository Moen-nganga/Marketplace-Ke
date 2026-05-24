const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const db       = require("../db/database");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ── Multer ────────────────────────────────────────────────────────────────────
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

// ── Synonyms ──────────────────────────────────────────────────────────────────
const synonyms = {
  "mobile phone":   ["iphone", "samsung", "phone", "smartphone", "android", "huawei", "tecno", "infinix", "oppo", "vivo"],
  "mobile phones":  ["iphone", "samsung", "phone", "smartphone", "android", "huawei", "tecno", "infinix", "oppo", "vivo"],
  "phone":          ["iphone", "samsung", "smartphone", "android", "huawei", "tecno", "infinix", "oppo", "vivo"],
  "phones":         ["iphone", "samsung", "smartphone", "android", "huawei", "tecno", "infinix", "oppo", "vivo"],
  "smartphone":     ["iphone", "samsung", "android", "huawei", "tecno", "infinix", "oppo"],
  "laptop":         ["macbook", "lenovo", "hp", "dell", "asus", "acer", "chromebook", "toshiba"],
  "laptops":        ["macbook", "lenovo", "hp", "dell", "asus", "acer", "chromebook", "toshiba"],
  "computer":       ["laptop", "macbook", "desktop", "pc", "lenovo", "hp", "dell"],
  "computers":      ["laptop", "macbook", "desktop", "pc", "lenovo", "hp", "dell"],
  "tv":             ["television", "samsung", "lg", "sony", "hisense", "tcl", "vitron"],
  "tvs":            ["television", "samsung", "lg", "sony", "hisense", "tcl", "vitron"],
  "television":     ["tv", "samsung", "lg", "sony", "hisense", "tcl"],
  "fridge":         ["refrigerator", "samsung", "lg", "von", "ramtons", "hisense"],
  "fridges":        ["refrigerator", "samsung", "lg", "von", "ramtons", "hisense"],
  "refrigerator":   ["fridge", "samsung", "lg", "von", "ramtons"],
  "washing machine":["washer", "samsung", "lg", "von", "ramtons", "hotpoint"],
  "car":            ["vehicle", "toyota", "nissan", "honda", "subaru", "mazda", "mercedes", "bmw", "audi"],
  "cars":           ["vehicle", "toyota", "nissan", "honda", "subaru", "mazda", "mercedes", "bmw"],
  "vehicle":        ["car", "toyota", "nissan", "honda", "subaru", "mazda", "truck", "van"],
  "vehicles":       ["car", "toyota", "nissan", "honda", "subaru", "mazda", "truck", "van"],
  "bike":           ["motorcycle", "bajaj", "honda", "yamaha", "suzuki", "tvs", "boxer"],
  "bikes":          ["motorcycles", "bajaj", "honda", "yamaha", "suzuki", "tvs"],
  "motorcycle":     ["bike", "bajaj", "honda", "yamaha", "suzuki", "tvs", "boxer"],
  "motorcycles":    ["bikes", "bajaj", "honda", "yamaha", "suzuki", "tvs"],
  "shoe":           ["sneaker", "boot", "sandal", "nike", "adidas", "jordan", "puma", "vans"],
  "shoes":          ["sneakers", "boots", "sandals", "nike", "adidas", "jordan", "puma"],
  "sneaker":        ["shoe", "nike", "adidas", "jordan", "puma", "vans", "converse"],
  "sneakers":       ["shoes", "nike", "adidas", "jordan", "puma", "vans", "converse"],
  "watch":          ["smartwatch", "casio", "rolex", "samsung", "apple watch", "timepiece"],
  "watches":        ["smartwatch", "casio", "rolex", "timepiece", "wristwatch"],
  "smartwatch":     ["watch", "samsung", "apple watch", "fitbit", "garmin", "huawei"],
  "headphone":      ["earphone", "earbuds", "airpods", "sony", "jbl", "bose", "sennheiser"],
  "headphones":     ["earphones", "earbuds", "airpods", "sony", "jbl", "bose"],
  "earphone":       ["headphone", "earbuds", "airpods", "sony", "jbl"],
  "earphones":      ["headphones", "earbuds", "airpods", "sony", "jbl"],
  "camera":         ["dslr", "canon", "nikon", "sony", "fujifilm", "gopro"],
  "cameras":        ["dslr", "canon", "nikon", "sony", "fujifilm", "gopro"],
  "tablet":         ["ipad", "samsung", "huawei", "lenovo", "android tablet"],
  "tablets":        ["ipad", "samsung", "huawei", "lenovo", "android tablet"],
  "sofa":           ["couch", "seat", "furniture", "settee"],
  "bed":            ["mattress", "furniture", "bedframe", "divan"],
  "mattress":       ["bed", "furniture", "spring", "foam"],
  "clothing":       ["clothes", "fashion", "shirt", "dress", "trouser", "jeans"],
  "clothes":        ["clothing", "fashion", "shirt", "dress", "trouser", "jeans"],
  "dress":          ["clothing", "clothes", "fashion", "gown", "frock"],
  "generator":      ["power", "genset", "kipor", "honda", "firman", "sumec"],
  "solar":          ["panel", "inverter", "battery", "power", "energy"],
  "dog":            ["puppy", "pet", "pup", "breed"],
  "dogs":           ["puppies", "pets", "pups", "breeds"],
  "cat":            ["kitten", "pet", "kitty"],
  "cats":           ["kittens", "pets"],
};

function expandQuery(q) {
  const lower   = q.toLowerCase().trim();
  const related = synonyms[lower] || [];
  const words   = lower.split(/\s+/);

  const terms = [
    ...words.map(w => `"${w}"*`),
    ...related.map(r => `"${r}"*`),
    // Also try each word with common typo variations
    ...words.flatMap(w => typoVariants(w)).map(v => `"${v}"*`),
  ];

  return [...new Set(terms)].join(" OR ");
}

function typoVariants(word) {
  if (word.length < 3) return [];
  const variants = new Set();

  // 1. Missing a letter — "iphon" matches "iphone"
  for (let i = 0; i < word.length; i++) {
    variants.add(word.slice(0, i) + word.slice(i + 1));
  }

  // 2. Swapped adjacent letters — "ipohne" matches "iphone"
  for (let i = 0; i < word.length - 1; i++) {
    const arr = word.split("");
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    variants.add(arr.join(""));
  }

  // 3. Common double-letter mistakes — "samssung" matches "samsung"
  for (let i = 0; i < word.length - 1; i++) {
    if (word[i] === word[i + 1]) {
      variants.add(word.slice(0, i) + word.slice(i + 1));
    }
  }

  // 4. Prefix — first 4 chars minimum so "sams" finds "samsung"
  if (word.length >= 4) {
    variants.add(word.slice(0, Math.max(4, word.length - 2)));
  }

  // Remove the original word itself since it's already in the main terms
  variants.delete(word);
  return [...variants];
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories").all());
});

// ── GET /api/listings ─────────────────────────────────────────────────────────
router.get("/", optionalAuth, (req, res) => {
  const {
    q, category_id, min_price, max_price, condition,
    location, sort = "newest", page = 1,
  } = req.query;

  const PAGE_SIZE = 20;
  const offset    = (parseInt(page) - 1) * PAGE_SIZE;

  // Use FTS5 when there's a search query
  if (q && q.trim()) {
    const searchTerm = expandQuery(q.trim());

    let where  = ["l.status = 'active'"];
    let params = [];

    if (category_id) { where.push("l.category_id = ?"); params.push(category_id); }
    if (min_price)   { where.push("l.price >= ?");       params.push(min_price); }
    if (max_price)   { where.push("l.price <= ?");       params.push(max_price); }
    if (condition)   { where.push("l.condition = ?");    params.push(condition); }
    if (location)    { where.push("l.location LIKE ?");  params.push(`%${location}%`); }

    const filterSQL = where.length ? `AND ${where.join(" AND ")}` : "";

    try {
      const listings = db.prepare(`
        SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
               c.name AS category_name, c.icon AS category_icon,
               fts.rank
        FROM   listings_fts fts
        JOIN   listings     l ON l.id = fts.rowid
        JOIN   users        u ON u.id = l.user_id
        JOIN   categories   c ON c.id = l.category_id
        WHERE  listings_fts MATCH ?
        ${filterSQL}
        ORDER  BY fts.rank
        LIMIT  ? OFFSET ?
      `).all(searchTerm, ...params, PAGE_SIZE, offset)
        .map(row => ({
          ...row,
          images: JSON.parse(row.images || "[]"),
          tags:   JSON.parse(row.tags   || "[]"),
        }));

      const total = db.prepare(`
        SELECT COUNT(*) AS n
        FROM   listings_fts fts
        JOIN   listings l ON l.id = fts.rowid
        WHERE  listings_fts MATCH ?
        ${filterSQL}
      `).get(searchTerm, ...params).n;

      // If FTS returned nothing, try LIKE fallback with partial words
      if (!listings.length) {
        const likeResults = db.prepare(`
          SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
                 c.name AS category_name, c.icon AS category_icon
          FROM   listings l
          JOIN   users      u ON u.id = l.user_id
          JOIN   categories c ON c.id = l.category_id
          WHERE  l.status = 'active'
          AND   (l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)
          ${filterSQL.replace(/AND l\./g, "AND l.")}
          ORDER  BY l.created_at DESC
          LIMIT  ? OFFSET ?
        `).all(
          `%${q}%`, `%${q}%`, `%${q}%`,
          ...params, PAGE_SIZE, offset
        ).map(row => ({
          ...row,
          images: JSON.parse(row.images || "[]"),
          tags:   JSON.parse(row.tags   || "[]"),
        }));

        return res.json({
          listings: likeResults,
          total:    likeResults.length,
          page:     parseInt(page),
          pages:    Math.ceil(likeResults.length / PAGE_SIZE),
        });
      }

      return res.json({
        listings,
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / PAGE_SIZE),
      });
    } catch {
      // FTS failed — fall through to LIKE search
    }
  }

  // Normal browse / fallback LIKE search
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

  const total = db.prepare(`
    SELECT COUNT(*) AS n FROM listings l ${whereSQL}
  `).get(...params).n;

  const listings = db.prepare(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
           c.name AS category_name, c.icon AS category_icon
    FROM   listings l
    JOIN   users      u ON u.id = l.user_id
    JOIN   categories c ON c.id = l.category_id
    ${whereSQL}
    ORDER  BY ${order}
    LIMIT  ? OFFSET ?
  `).all(...params, PAGE_SIZE, offset)
    .map(row => ({
      ...row,
      images: JSON.parse(row.images || "[]"),
      tags:   JSON.parse(row.tags   || "[]"),
    }));

  res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / PAGE_SIZE) });
});

// ── GET /api/listings/user/:userId ────────────────────────────────────────────
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
    .map(row => ({
      ...row,
      images: JSON.parse(row.images || "[]"),
      tags:   JSON.parse(row.tags   || "[]"),
    }));

  res.json(listings);
});

// ── GET /api/listings/search/users ───────────────────────────────────────────
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

// ── GET /api/listings/tags/suggest ───────────────────────────────────────────
router.get("/tags/suggest", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 1) return res.json([]);

  const rows = db.prepare(`
    SELECT tags FROM listings
    WHERE tags != '[]' AND status = 'active'
  `).all();

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

// ── GET /api/listings/suggest ─────────────────────────────────────────────────
router.get("/suggest", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const searchTerm = expandQuery(q.trim());

    const results = db.prepare(`
      SELECT DISTINCT l.title, l.id, l.price, l.images
      FROM   listings_fts fts
      JOIN   listings l ON l.id = fts.rowid
      WHERE  listings_fts MATCH ?
      AND    l.status = 'active'
      ORDER  BY fts.rank
      LIMIT  6
    `).all(searchTerm)
      .map(r => ({
        ...r,
        images: JSON.parse(r.images || "[]"),
      }));

    // If FTS found nothing, fall back to LIKE
    if (!results.length) {
      const fallback = db.prepare(`
        SELECT DISTINCT title, id, price, images
        FROM   listings
        WHERE  (title LIKE ? OR description LIKE ?)
        AND    status = 'active'
        LIMIT  6
      `).all(`%${q}%`, `%${q}%`)
        .map(r => ({ ...r, images: JSON.parse(r.images || "[]") }));
      return res.json(fallback);
    }

    res.json(results);
  } catch {
    const results = db.prepare(`
      SELECT DISTINCT title, id, price, images
      FROM   listings
      WHERE  title LIKE ? AND status = 'active'
      LIMIT  6
    `).all(`%${q}%`)
      .map(r => ({ ...r, images: JSON.parse(r.images || "[]") }));
    res.json(results);
  }
});

// ── GET /api/listings/:id ─────────────────────────────────────────────────────
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

// ── POST /api/listings ────────────────────────────────────────────────────────
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
  listing.tags   = JSON.parse(listing.tags || "[]");
  res.status(201).json(listing);
});

// ── PATCH /api/listings/:id ───────────────────────────────────────────────────
router.patch("/:id", requireAuth, (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing)                        return res.status(404).json({ error: "Not found" });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { title, description, price, condition, location, status, tags, images, reason } = req.body;

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
    title        || null,
    description  || null,
    price        ? parseFloat(price) : null,
    condition    || null,
    location     || null,
    status       || null,
    reason       || null,
    tags         || null,
    images       || null,
    req.body.category_id || null,
    listing.id
  );

  const updated = db.prepare("SELECT * FROM listings WHERE id = ?").get(listing.id);
  updated.images = JSON.parse(updated.images || "[]");
  updated.tags   = JSON.parse(updated.tags   || "[]");
  res.json(updated);
});

// ── DELETE /api/listings/:id ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing)                        return res.status(404).json({ error: "Not found" });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("UPDATE listings SET status = 'deleted' WHERE id = ?").run(listing.id);
  res.json({ success: true });
});

module.exports = router;