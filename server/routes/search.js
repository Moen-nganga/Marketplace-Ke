const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/search/history ──────────────────────────────────────────────────
router.post("/history", requireAuth, async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 2) return res.json({ success: false });

  const q = query.trim().toLowerCase();

  // Delete if exists then reinsert at top
  await pool.query(
    "DELETE FROM search_history WHERE user_id = $1 AND query = $2",
    [req.user.id, q]
  );

  await pool.query(
    "INSERT INTO search_history (user_id, query) VALUES ($1, $2)",
    [req.user.id, q]
  );

  // Keep only last 3
  await pool.query(`
    DELETE FROM search_history
    WHERE user_id = $1
    AND id NOT IN (
      SELECT id FROM search_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 3
    )
  `, [req.user.id]);

  res.json({ success: true });
});

// ── GET /api/search/history ───────────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT query, created_at FROM search_history
    WHERE  user_id = $1
    ORDER  BY created_at DESC
    LIMIT  3
  `, [req.user.id]);

  res.json(result.rows);
});

// ── DELETE /api/search/history ────────────────────────────────────────────────
router.delete("/history", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM search_history WHERE user_id = $1",
    [req.user.id]
  );
  res.json({ success: true });
});

// ── DELETE /api/search/history/:query ────────────────────────────────────────
router.delete("/history/:query", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM search_history WHERE user_id = $1 AND query = $2",
    [req.user.id, decodeURIComponent(req.params.query)]
  );
  res.json({ success: true });
});

module.exports = router;