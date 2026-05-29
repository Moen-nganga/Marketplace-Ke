const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/search/history — save a search query ───────────────────────────
router.post("/history", requireAuth, (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 2) return res.json({ success: false });

  const q = query.trim().toLowerCase();

  // Delete if already exists so we can re-insert at top
  db.prepare("DELETE FROM search_history WHERE user_id = ? AND query = ?")
    .run(req.user.id, q);

  // Insert fresh at top
  db.prepare("INSERT INTO search_history (user_id, query) VALUES (?, ?)")
    .run(req.user.id, q);

  // Keep only last 10 searches per user
  // Keep only last 3 searches per user
  db.prepare(`
    DELETE FROM search_history
    WHERE user_id = ?
    AND id NOT IN (
      SELECT id FROM search_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    )
  `).run(req.user.id, req.user.id);

  res.json({ success: true });
});

// ── GET /api/search/history — get recent searches ────────────────────────────
router.get("/history", requireAuth, (req, res) => {
  const history = db.prepare(`
    SELECT query, created_at FROM search_history
    WHERE  user_id = ?
    ORDER  BY created_at DESC
    LIMIT  3
  `).all(req.user.id);

  res.json(history);
});

// ── DELETE /api/search/history — clear all search history ────────────────────
router.delete("/history", requireAuth, (req, res) => {
  db.prepare("DELETE FROM search_history WHERE user_id = ?").run(req.user.id);
  res.json({ success: true });
});

// ── DELETE /api/search/history/:query — remove one search ────────────────────
router.delete("/history/:query", requireAuth, (req, res) => {
  db.prepare("DELETE FROM search_history WHERE user_id = ? AND query = ?")
    .run(req.user.id, decodeURIComponent(req.params.query));
  res.json({ success: true });
});

module.exports = router;