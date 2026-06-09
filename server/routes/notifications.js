const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT * FROM notifications
    WHERE  user_id = $1
    ORDER  BY created_at DESC
    LIMIT  30
  `, [req.user.id]);

  const unread = await pool.query(`
    SELECT COUNT(*) FROM notifications
    WHERE user_id = $1 AND is_read = 0
  `, [req.user.id]);

  res.json({
    notifications: result.rows,
    unread:        parseInt(unread.rows[0].count),
  });
});

// ── POST /api/notifications/read ─────────────────────────────────────────────
router.post("/read", requireAuth, async (req, res) => {
  await pool.query(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = $1 AND is_read = 0
  `, [req.user.id]);
  res.json({ success: true });
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Not found" });

  await pool.query("DELETE FROM notifications WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// ── DELETE /api/notifications ─────────────────────────────────────────────────
router.delete("/", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM notifications WHERE user_id = $1", [req.user.id]);
  res.json({ success: true });
});

module.exports = router;

// ── Helper ────────────────────────────────────────────────────────────────────
async function createNotification(user_id, type, message, link) {
  try {
    const recent = await pool.query(`
      SELECT id FROM notifications
      WHERE user_id = $1 AND type = $2 AND message = $3
      AND created_at > NOW() - INTERVAL '1 hour'
    `, [user_id, type, message]);

    if (!recent.rows.length) {
      await pool.query(`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES ($1, $2, $3, $4)
      `, [user_id, type, message, link || null]);
    }
  } catch (e) {
    console.error("Notification error:", e.message);
  }
}

module.exports.createNotification = createNotification;