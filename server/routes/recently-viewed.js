const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/recently-viewed/:listingId ──────────────────────────────────────
router.post("/:listingId", requireAuth, async (req, res) => {
  const uid       = req.user.id;
  const listingId = req.params.listingId;

  // Upsert — update viewed_at if already exists
  await pool.query(`
    INSERT INTO recently_viewed (user_id, listing_id, viewed_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id, listing_id)
    DO UPDATE SET viewed_at = NOW()
  `, [uid, listingId]);

  // Keep only last 20 per user
  await pool.query(`
    DELETE FROM recently_viewed
    WHERE user_id = $1
    AND id NOT IN (
      SELECT id FROM recently_viewed
      WHERE user_id = $1
      ORDER BY viewed_at DESC
      LIMIT 20
    )
  `, [uid]);

  res.json({ success: true });
});

// ── GET /api/recently-viewed ──────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT l.*, u.name AS seller_name,
           c.name AS category_name, c.icon AS category_icon,
           rv.viewed_at
    FROM   recently_viewed rv
    JOIN   listings     l ON l.id = rv.listing_id
    JOIN   users        u ON u.id = l.user_id
    JOIN   categories   c ON c.id = l.category_id
    WHERE  rv.user_id = $1 AND l.status != 'deleted'
    ORDER  BY rv.viewed_at DESC
    LIMIT  10
  `, [req.user.id]);

  res.json(result.rows);
});

// ── DELETE /api/recently-viewed ───────────────────────────────────────────────
router.delete("/", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM recently_viewed WHERE user_id = $1",
    [req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;