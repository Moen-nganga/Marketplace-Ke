const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/saved ────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT l.*, u.name AS seller_name,
           c.name AS category_name, c.icon AS category_icon
    FROM   saved_listings s
    JOIN   listings     l ON l.id = s.listing_id
    JOIN   users        u ON u.id = l.user_id
    JOIN   categories   c ON c.id = l.category_id
    WHERE  s.user_id = $1 AND l.status != 'deleted'
    ORDER  BY s.saved_at DESC
  `, [req.user.id]);

  res.json(result.rows);
});

// ── GET /api/saved/check/:listingId ──────────────────────────────────────────
router.get("/check/:listingId", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT listing_id FROM saved_listings WHERE user_id = $1 AND listing_id = $2",
    [req.user.id, req.params.listingId]
  );
  res.json({ saved: result.rows.length > 0 });
});

// ── POST /api/saved/:listingId ────────────────────────────────────────────────
router.post("/:listingId", requireAuth, async (req, res) => {
  const uid       = req.user.id;
  const listingId = req.params.listingId;

  const listing = await pool.query(
    "SELECT id, user_id FROM listings WHERE id = $1 AND status != 'deleted'",
    [listingId]
  );
  if (!listing.rows.length)
    return res.status(404).json({ error: "Listing not found" });
  if (listing.rows[0].user_id === uid)
    return res.status(400).json({ error: "You cannot save your own listing" });

  const existing = await pool.query(
    "SELECT listing_id FROM saved_listings WHERE user_id = $1 AND listing_id = $2",
    [uid, listingId]
  );
  if (existing.rows.length)
    return res.status(409).json({ error: "Already saved" });

  await pool.query(
    "INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2)",
    [uid, listingId]
  );
  res.json({ success: true, saved: true });
});

// ── DELETE /api/saved/:listingId ──────────────────────────────────────────────
router.delete("/:listingId", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2",
    [req.user.id, req.params.listingId]
  );
  res.json({ success: true, saved: false });
});

module.exports = router;