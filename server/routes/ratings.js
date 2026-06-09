const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/ratings/:userId ──────────────────────────────────────────────────
router.get("/:userId", async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, u.name AS rater_name
    FROM   ratings r
    JOIN   users u ON u.id = r.rater_id
    WHERE  r.rated_id = $1
    ORDER  BY r.created_at DESC
  `, [req.params.userId]);

  const ratings = result.rows;
  const avg     = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : null;

  res.json({ ratings, average: avg, total: ratings.length });
});

// ── POST /api/ratings/:userId ─────────────────────────────────────────────────
router.post("/:userId", requireAuth, async (req, res) => {
  const rated_id = parseInt(req.params.userId);
  const rater_id = req.user.id;

  if (rater_id === rated_id)
    return res.status(400).json({ error: "You cannot rate yourself" });

  const { score, review } = req.body;
  if (!score || score < 1 || score > 5)
    return res.status(400).json({ error: "Score must be between 1 and 5" });

  const existing = await pool.query(
    "SELECT id FROM ratings WHERE rater_id = $1 AND rated_id = $2",
    [rater_id, rated_id]
  );

  if (existing.rows.length) {
    await pool.query(`
      UPDATE ratings SET score = $1, review = $2, created_at = NOW()
      WHERE rater_id = $3 AND rated_id = $4
    `, [score, review || null, rater_id, rated_id]);
  } else {
    await pool.query(
      "INSERT INTO ratings (rater_id, rated_id, score, review) VALUES ($1, $2, $3, $4)",
      [rater_id, rated_id, score, review || null]
    );
  }

  // Notify rated user
  const rater = await pool.query("SELECT name FROM users WHERE id = $1", [rater_id]);
  const { createNotification } = require("./notifications");
  createNotification(
    rated_id,
    "rating",
    `${rater.rows[0].name} gave you a ${score}-star rating`,
    `/profile.html?id=${rated_id}`
  );

  res.json({ success: true });
});

// ── DELETE /api/ratings/:userId ───────────────────────────────────────────────
router.delete("/:userId", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM ratings WHERE rater_id = $1 AND rated_id = $2",
    [req.user.id, parseInt(req.params.userId)]
  );
  res.json({ success: true });
});

module.exports = router;