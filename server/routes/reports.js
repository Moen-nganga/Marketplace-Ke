const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/reports — submit a report ──────────────────────────────────────
router.post("/", requireAuth, (req, res) => {
  const { listing_id, user_id, reason, details } = req.body;
  const reporter_id = req.user.id;

  if (!reason)
    return res.status(400).json({ error: "Reason is required" });
  if (!listing_id && !user_id)
    return res.status(400).json({ error: "Must report a listing or a user" });

  // Prevent reporting yourself
  if (user_id && parseInt(user_id) === reporter_id)
    return res.status(400).json({ error: "You cannot report yourself" });

  // Prevent duplicate reports
  const existing = listing_id
    ? db.prepare("SELECT id FROM reports WHERE reporter_id = ? AND listing_id = ?").get(reporter_id, listing_id)
    : db.prepare("SELECT id FROM reports WHERE reporter_id = ? AND user_id = ?").get(reporter_id, user_id);

  if (existing)
    return res.status(409).json({ error: "You have already reported this" });

  db.prepare(`
    INSERT INTO reports (reporter_id, listing_id, user_id, reason, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(reporter_id, listing_id || null, user_id || null, reason, details || null);

  res.json({ success: true });
});

// ── GET /api/reports/listing/:id — get reports for a listing ─────────────────
router.get("/listing/:id", (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, u.name AS reporter_name
    FROM   reports r
    JOIN   users u ON u.id = r.reporter_id
    WHERE  r.listing_id = ?
    ORDER  BY r.created_at DESC
  `).all(req.params.id);

  res.json({ count: reports.length, reports });
});

module.exports = router;