require("dotenv").config();
const express  = require("express");
const multer   = require("multer");
const pool     = require("../db/postgres");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const cloudinary             = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "Marketplace Ke/listings",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 1200, height: 900, crop: "limit", quality: "auto" }],
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
  "mobile phone":   ["iphone","samsung","phone","smartphone","android","huawei","tecno","infinix","oppo","vivo"],
  "mobile phones":  ["iphone","samsung","phone","smartphone","android","huawei","tecno","infinix","oppo","vivo"],
  "phone":          ["iphone","samsung","smartphone","android","huawei","tecno","infinix","oppo","vivo"],
  "phones":         ["iphone","samsung","smartphone","android","huawei","tecno","infinix","oppo","vivo"],
  "laptop":         ["macbook","lenovo","hp","dell","asus","acer","chromebook","toshiba"],
  "laptops":        ["macbook","lenovo","hp","dell","asus","acer","chromebook","toshiba"],
  "computer":       ["laptop","macbook","desktop","pc","lenovo","hp","dell"],
  "tv":             ["television","samsung","lg","sony","hisense","tcl","vitron"],
  "tvs":            ["television","samsung","lg","sony","hisense","tcl","vitron"],
  "fridge":         ["refrigerator","samsung","lg","von","ramtons","hisense"],
  "car":            ["vehicle","toyota","nissan","honda","subaru","mazda","mercedes","bmw","audi"],
  "cars":           ["vehicle","toyota","nissan","honda","subaru","mazda","mercedes","bmw"],
  "bike":           ["motorcycle","bajaj","honda","yamaha","suzuki","tvs","boxer"],
  "motorcycle":     ["bike","bajaj","honda","yamaha","suzuki","tvs","boxer"],
  "shoe":           ["sneaker","boot","sandal","nike","adidas","jordan","puma","vans"],
  "shoes":          ["sneakers","boots","sandals","nike","adidas","jordan","puma"],
  "watch":          ["smartwatch","casio","rolex","samsung","apple watch","timepiece"],
  "watches":        ["smartwatch","casio","rolex","timepiece","wristwatch"],
  "headphones":     ["earphones","earbuds","airpods","sony","jbl","bose"],
  "camera":         ["dslr","canon","nikon","sony","fujifilm","gopro"],
  "tablet":         ["ipad","samsung","huawei","lenovo","android tablet"],
  "sofa":           ["couch","seat","furniture","settee"],
  "dog":            ["puppy","pet","pup","breed"],
  "cat":            ["kitten","pet","kitty"],
};

function expandQuery(q) {
  const lower   = q.toLowerCase().trim();
  const related = synonyms[lower] || [];
  const words   = lower.split(/\s+/);
  const terms   = [...words, ...related];
  return [...new Set(terms)];
}

// ── GET /api/categories ───────────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  const parents = await pool.query("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id");
  const result  = await Promise.all(parents.rows.map(async p => {
    const children = await pool.query("SELECT * FROM categories WHERE parent_id = $1 ORDER BY id", [p.id]);
    return { ...p, children: children.rows };
  }));
  res.json(result);
});

// ── GET /api/listings ─────────────────────────────────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
  const {
    q, category_id, min_price, max_price, condition,
    location, sort = "newest", page = 1,
  } = req.query;

  const PAGE_SIZE = 20;
  const offset    = (parseInt(page) - 1) * PAGE_SIZE;
  const params    = [];
  const where     = ["l.status = 'active'"];

  if (category_id) { params.push(category_id);    where.push(`l.category_id = $${params.length}`); }
  if (min_price)   { params.push(min_price);       where.push(`l.price >= $${params.length}`); }
  if (max_price)   { params.push(max_price);       where.push(`l.price <= $${params.length}`); }
  if (condition)   { params.push(condition);       where.push(`l.condition = $${params.length}`); }
  if (location)    { params.push(`%${location}%`); where.push(`l.location ILIKE $${params.length}`); }

  if (q && q.trim()) {
    const terms = expandQuery(q.trim());
    const orClauses = terms.map(term => {
      params.push(`%${term}%`);
      const n = params.length;
      return `(l.title ILIKE $${n} OR l.description ILIKE $${n} OR l.tags::text ILIKE $${n})`;
    });
    where.push(`(${orClauses.join(" OR ")})`);
  }

  const whereSQL = `WHERE ${where.join(" AND ")}`;

  const orderMap = {
    newest:     "l.is_promoted DESC, l.created_at DESC",
    oldest:     "l.is_promoted DESC, l.created_at ASC",
    price_asc:  "l.is_promoted DESC, l.price ASC",
    price_desc: "l.is_promoted DESC, l.price DESC",
    popular:    "l.is_promoted DESC, l.views DESC",
  };
  const order = orderMap[sort] || orderMap.newest;

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM listings l ${whereSQL}`, params
  );
  const total = parseInt(countRes.rows[0].count);

  params.push(PAGE_SIZE, offset);
  const listRes = await pool.query(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
           c.name AS category_name, c.icon AS category_icon
    FROM   listings l
    JOIN   users      u ON u.id = l.user_id
    JOIN   categories c ON c.id = l.category_id
    ${whereSQL}
    ORDER  BY ${order}
    LIMIT  $${params.length - 1} OFFSET $${params.length}
  `, params);

  res.json({
    listings: listRes.rows,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / PAGE_SIZE),
  });
});

// ── GET /api/listings/user/:userId ────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
  const result = await pool.query(`
    SELECT l.*, c.name AS category_name, c.icon AS category_icon
    FROM   listings l
    JOIN   categories c ON c.id = l.category_id
    WHERE  l.user_id = $1 AND l.status != 'deleted'
    ORDER  BY l.created_at DESC
  `, [req.params.userId]);
  res.json(result.rows);
});

// ── GET /api/listings/user/:userId/all ────────────────────────────────────────
router.get("/user/:userId/all", requireAuth, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const result = await pool.query(`
    SELECT l.*, c.name AS category_name, c.icon AS category_icon
    FROM   listings l
    JOIN   categories c ON c.id = l.category_id
    WHERE  l.user_id = $1 AND l.status != 'deleted'
    ORDER  BY l.created_at DESC
  `, [req.params.userId]);
  res.json(result.rows);
});

// ── GET /api/listings/search/users ───────────────────────────────────────────
router.get("/search/users", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(`
    SELECT u.id, u.name, u.created_at,
           COUNT(l.id) AS listing_count,
           ROUND(AVG(r.score)::numeric, 1) AS avg_rating,
           COUNT(r.id) AS rating_count
    FROM   users u
    LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'active'
    LEFT JOIN ratings  r ON r.rated_id = u.id
    WHERE  u.name ILIKE $1
    GROUP  BY u.id
    ORDER  BY listing_count DESC
    LIMIT  10
  `, [`%${q}%`]);
  res.json(result.rows);
});

// ── GET /api/listings/tags/suggest ───────────────────────────────────────────
router.get("/tags/suggest", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(`
    SELECT tags FROM listings
    WHERE  status = 'active' AND tags != '[]'
  `);

  const freq = {};
  result.rows.forEach(row => {
    try {
      const tags = Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]");
      tags.forEach(tag => {
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
router.get("/suggest", async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  const terms   = expandQuery(q.trim());
  const orParts = terms.map((t, i) => `title ILIKE $${i + 1}`);
  const params  = terms.map(t => `%${t}%`);

  const result = await pool.query(`
    SELECT DISTINCT title, id, price, images
    FROM   listings
    WHERE  status = 'active' AND (${orParts.join(" OR ")})
    LIMIT  6
  `, params);

  res.json(result.rows);
});

// ── GET /api/listings/:id/related ─────────────────────────────────────────────
router.get("/:id/related", async (req, res) => {
  const listing = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
  if (!listing.rows.length) return res.json([]);

  const l    = listing.rows[0];
  const tags = Array.isArray(l.tags) ? l.tags : JSON.parse(l.tags || "[]");

  let result;
  if (tags.length) {
    const tagParams  = tags.map((t, i) => `$${i + 3}`);
    const tagValues  = tags.map(t => `%${t}%`);
    result = await pool.query(`
      SELECT l.*, u.name AS seller_name,
             c.name AS category_name, c.icon AS category_icon
      FROM   listings l
      JOIN   users      u ON u.id = l.user_id
      JOIN   categories c ON c.id = l.category_id
      WHERE  l.id != $1 AND l.status = 'active'
      AND    (l.category_id = $2 OR ${tagParams.map(p => `l.tags::text ILIKE ${p}`).join(" OR ")})
      ORDER  BY l.created_at DESC
      LIMIT  6
    `, [req.params.id, l.category_id, ...tagValues]);
  } else {
    result = await pool.query(`
      SELECT l.*, u.name AS seller_name,
             c.name AS category_name, c.icon AS category_icon
      FROM   listings l
      JOIN   users      u ON u.id = l.user_id
      JOIN   categories c ON c.id = l.category_id
      WHERE  l.id != $1 AND l.status = 'active' AND l.category_id = $2
      ORDER  BY l.created_at DESC
      LIMIT  6
    `, [req.params.id, l.category_id]);
  }
  res.json(result.rows);
});

// ── GET /api/listings/:id ─────────────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
           u.created_at AS seller_since, u.avatar AS seller_avatar,
           c.name AS category_name, c.icon AS category_icon
    FROM   listings l
    JOIN   users      u ON u.id = l.user_id
    JOIN   categories c ON c.id = l.category_id
    WHERE  l.id = $1 AND l.status != 'deleted'
  `, [req.params.id]);

  if (!result.rows.length) return res.status(404).json({ error: "Listing not found" });

  await pool.query("UPDATE listings SET views = views + 1 WHERE id = $1", [req.params.id]);

  const listing = result.rows[0];
  const newViews = listing.views + 1;
  if (newViews % 10 === 0) {
    const { createNotification } = require("./notifications");
    createNotification(
      listing.user_id,
      "view",
      `Your listing "${listing.title}" has reached ${newViews} views!`,
      `/listing.html?id=${listing.id}`
    );
  }

  res.json(listing);
});

// ── POST /api/listings ────────────────────────────────────────────────────────
router.post("/", requireAuth, upload.array("images", 6), async (req, res) => {
  const { title, description, price, condition, category_id, location, reason, tags } = req.body;

  console.log("BODY:", { title, description, price, condition, category_id, location });

  if (!title || !description || !price || !condition || !category_id || !location)
    return res.status(400).json({ 
      error: `Missing fields: ${[
        !title && "title",
        !description && "description", 
        !price && "price",
        !condition && "condition",
        !category_id && "category_id",
        !location && "location"
      ].filter(Boolean).join(", ")}`
    });

  const images = (req.files || []).map(f => f.path);

  const result = await pool.query(`
    INSERT INTO listings
      (user_id, category_id, title, description, reason, price, condition, location, images, tags)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `, [
    req.user.id, category_id, title, description,
    reason || null, parseFloat(price), condition, location,
    JSON.stringify(images), tags || "[]"
  ]);

  res.status(201).json(result.rows[0]);
});

// ── PATCH /api/listings/:id ───────────────────────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  const listRes = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
  if (!listRes.rows.length)               return res.status(404).json({ error: "Not found" });
  if (listRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { title, description, price, condition, location, status, reason, tags, images, category_id } = req.body;
  const l = listRes.rows[0];

  const result = await pool.query(`
    UPDATE listings SET
      title       = COALESCE($1,  title),
      description = COALESCE($2,  description),
      price       = COALESCE($3,  price),
      condition   = COALESCE($4,  condition),
      location    = COALESCE($5,  location),
      status      = COALESCE($6,  status),
      reason      = COALESCE($7,  reason),
      tags        = COALESCE($8,  tags),
      images      = COALESCE($9,  images),
      category_id = COALESCE($10, category_id)
    WHERE id = $11
    RETURNING *
  `, [
    title || null, description || null,
    price ? parseFloat(price) : null,
    condition || null, location || null, status || null,
    reason || null,
    tags ? tags : null,
    images ? images : null,
    category_id || null,
    req.params.id
  ]);

  res.json(result.rows[0]);
});

// ── DELETE /api/listings/:id ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  const listRes = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
  if (!listRes.rows.length)               return res.status(404).json({ error: "Not found" });
  if (listRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  await pool.query("UPDATE listings SET status = 'deleted' WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// ── POST /api/listings/:id/promote ───────────────────────────────────────────
router.post("/:id/promote", requireAuth, async (req, res) => {
  const listRes = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
  if (!listRes.rows.length)               return res.status(404).json({ error: "Not found" });
  if (listRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (listRes.rows[0].status !== "active") return res.status(400).json({ error: "Only active listings can be promoted" });

  const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "UPDATE listings SET is_promoted = 1, promoted_until = $1 WHERE id = $2",
    [until, req.params.id]
  );
  res.json({ success: true, promoted_until: until });
});

module.exports = router;