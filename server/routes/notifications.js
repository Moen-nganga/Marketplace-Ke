const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
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

// ── DELETE /api/notifications/:id — delete one ───────────────────────────────
router.delete("/:id", requireAuth, (req, res) => {
  const notif = db.prepare(
    "SELECT * FROM notifications WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.user.id);

  if (!notif) return res.status(404).json({ error: "Not found" });

  db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── DELETE /api/notifications — delete all ────────────────────────────────────
router.delete("/", requireAuth, (req, res) => {
  db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.user.id);
  res.json({ success: true });
});

module.exports = router;

// ── Helper ────────────────────────────────────────────────────────────────────
function createNotification(user_id, type, message, link) {
  try {
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