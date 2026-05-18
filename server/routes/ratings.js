const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/ratings/:userId — get all ratings for a user ───────────────────
router.get("/:userId", (req, res) => {
  const ratings = db.prepare(`
    SELECT r.*, u.name AS rater_name
    FROM   ratings r
    JOIN   users u ON u.id = r.rater_id
    WHERE  r.rated_id = ?
    ORDER  BY r.created_at DESC
  `).all(req.params.userId);

  const avg = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : null;

  res.json({ ratings, average: avg, total: ratings.length });
});

// ── POST /api/ratings/:userId — submit or update a rating ───────────────────
router.post("/:userId", requireAuth, (req, res) => {
  const rated_id = parseInt(req.params.userId);
  const rater_id = req.user.id;

  if (rater_id === rated_id)
    return res.status(400).json({ error: "You cannot rate yourself" });

  const { score, review } = req.body;

  if (!score || score < 1 || score > 5)
    return res.status(400).json({ error: "Score must be between 1 and 5" });

  // Upsert — update if already rated, insert if not
  const existing = db.prepare(
    "SELECT id FROM ratings WHERE rater_id = ? AND rated_id = ?"
  ).get(rater_id, rated_id);

  if (existing) {
    db.prepare(`
      UPDATE ratings SET score = ?, review = ?, created_at = datetime('now')
      WHERE rater_id = ? AND rated_id = ?
    `).run(score, review || null, rater_id, rated_id);
  } else {
    db.prepare(`
      INSERT INTO ratings (rater_id, rated_id, score, review)
      VALUES (?, ?, ?, ?)
    `).run(rater_id, rated_id, score, review || null);
  }

  res.json({ success: true });
});

// ── DELETE /api/ratings/:userId — remove your rating ───────────────────────
router.delete("/:userId", requireAuth, (req, res) => {
  db.prepare(
    "DELETE FROM ratings WHERE rater_id = ? AND rated_id = ?"
  ).run(req.user.id, parseInt(req.params.userId));

  res.json({ success: true });
});

module.exports = router;