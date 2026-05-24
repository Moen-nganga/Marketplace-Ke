const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/notifications — get all notifications for logged in user ─────────
router.get("/", requireAuth, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE  user_id = ?
    ORDER  BY created_at DESC
    LIMIT  30
  `).all(req.user.id);

  const unread = db.prepare(`
    SELECT COUNT(*) AS n FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(req.user.id).n;

  res.json({ notifications, unread });
});

// ── POST /api/notifications/read — mark all as read ───────────────────────────
router.post("/read", requireAuth, (req, res) => {
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ? AND is_read = 0
  `).run(req.user.id);
  res.json({ success: true });
});

module.exports = router;

// ── Helper to create a notification (used by other routes) ────────────────────
function createNotification(user_id, type, message, link) {
  try {
    // Don't create duplicate notifications within 1 hour
    const recent = db.prepare(`
      SELECT id FROM notifications
      WHERE user_id = ? AND type = ? AND message = ?
      AND created_at > datetime('now', '-1 hour')
    `).get(user_id, type, message);

    if (!recent) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (?, ?, ?, ?)
      `).run(user_id, type, message, link || null);
    }
  } catch {}
}

module.exports.createNotification = createNotification;