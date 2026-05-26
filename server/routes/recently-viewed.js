const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/recently-viewed/:listingId — record a view ─────────────────────
router.post("/:listingId", requireAuth, (req, res) => {
  const uid       = req.user.id;
  const listingId = req.params.listingId;

  // Upsert — update viewed_at if already exists
  const existing = db.prepare(
    "SELECT id FROM recently_viewed WHERE user_id = ? AND listing_id = ?"
  ).get(uid, listingId);

  if (existing) {
    db.prepare("UPDATE recently_viewed SET viewed_at = datetime('now') WHERE id = ?")
      .run(existing.id);
  } else {
    db.prepare("INSERT INTO recently_viewed (user_id, listing_id) VALUES (?, ?)")
      .run(uid, listingId);
  }

  // Keep only last 20 per user
  db.prepare(`
    DELETE FROM recently_viewed
    WHERE user_id = ?
    AND id NOT IN (
      SELECT id FROM recently_viewed
      WHERE user_id = ?
      ORDER BY viewed_at DESC
      LIMIT 20
    )
  `).run(uid, uid);

  res.json({ success: true });
});

// ── GET /api/recently-viewed — get recently viewed listings ───────────────────
router.get("/", requireAuth, (req, res) => {
  const listings = db.prepare(`
    SELECT l.*, u.name AS seller_name,
           c.name AS category_name, c.icon AS category_icon,
           rv.viewed_at
    FROM   recently_viewed rv
    JOIN   listings     l ON l.id = rv.listing_id
    JOIN   users        u ON u.id = l.user_id
    JOIN   categories   c ON c.id = l.category_id
    WHERE  rv.user_id = ? AND l.status != 'deleted'
    ORDER  BY rv.viewed_at DESC
    LIMIT  10
  `).all(req.user.id)
    .map(row => ({
      ...row,
      images: JSON.parse(row.images || "[]"),
      tags:   JSON.parse(row.tags   || "[]"),
    }));

  res.json(listings);
});

// ── DELETE /api/recently-viewed — clear history ───────────────────────────────
router.delete("/", requireAuth, (req, res) => {
  db.prepare("DELETE FROM recently_viewed WHERE user_id = ?").run(req.user.id);
  res.json({ success: true });
});

module.exports = router;