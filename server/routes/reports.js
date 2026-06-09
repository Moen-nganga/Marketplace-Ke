const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/reports ─────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  const { listing_id, user_id, reason, details } = req.body;
  const reporter_id = req.user.id;

  if (!reason)
    return res.status(400).json({ error: "Reason is required" });
  if (!listing_id && !user_id)
    return res.status(400).json({ error: "Must report a listing or a user" });
  if (user_id && parseInt(user_id) === reporter_id)
    return res.status(400).json({ error: "You cannot report yourself" });

  const existing = listing_id
    ? await pool.query(
        "SELECT id FROM reports WHERE reporter_id = $1 AND listing_id = $2",
        [reporter_id, listing_id]
      )
    : await pool.query(
        "SELECT id FROM reports WHERE reporter_id = $1 AND user_id = $2",
        [reporter_id, user_id]
      );

  if (existing.rows.length)
    return res.status(409).json({ error: "You have already reported this" });

  await pool.query(`
    INSERT INTO reports (reporter_id, listing_id, user_id, reason, details)
    VALUES ($1, $2, $3, $4, $5)
  `, [reporter_id, listing_id || null, user_id || null, reason, details || null]);

  res.json({ success: true });
});

// ── GET /api/reports/listing/:id ──────────────────────────────────────────────
router.get("/listing/:id", async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, u.name AS reporter_name
    FROM   reports r
    JOIN   users u ON u.id = r.reporter_id
    WHERE  r.listing_id = $1
    ORDER  BY r.created_at DESC
  `, [req.params.id]);

  res.json({ count: result.rows.length, reports: result.rows });
});

module.exports = router;