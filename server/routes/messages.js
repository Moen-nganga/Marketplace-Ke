const express = require("express");
const pool    = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/messages/inbox ───────────────────────────────────────────────────
router.get("/inbox", requireAuth, async (req, res) => {
  const uid = req.user.id;

  const result = await pool.query(`
    SELECT
      c.*,
      CASE WHEN c.user1_id = $1 THEN u2.id   ELSE u1.id   END AS other_id,
      CASE WHEN c.user1_id = $1 THEN u2.name ELSE u1.name END AS other_name,
      l.title  AS listing_title,
      l.images AS listing_images,
      (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT iv         FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_iv,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT sender_id  FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
    FROM   conversations c
    JOIN   users u1 ON u1.id = c.user1_id
    JOIN   users u2 ON u2.id = c.user2_id
    LEFT JOIN listings l ON l.id = c.listing_id
    WHERE  c.user1_id = $1 OR c.user2_id = $1
    ORDER  BY last_message_at DESC NULLS LAST
  `, [uid]);

  res.json(result.rows);
});

// ── POST /api/messages/conversation ──────────────────────────────────────────
router.post("/conversation", requireAuth, async (req, res) => {
  const { other_id, listing_id } = req.body;
  const uid = req.user.id;

  if (!other_id)
    return res.status(400).json({ error: "other_id is required" });
  if (uid === parseInt(other_id))
    return res.status(400).json({ error: "Cannot message yourself" });

  const user1_id = Math.min(uid, parseInt(other_id));
  const user2_id = Math.max(uid, parseInt(other_id));

  const existing = await pool.query(`
    SELECT * FROM conversations
    WHERE user1_id = $1 AND user2_id = $2 AND listing_id IS NOT DISTINCT FROM $3
  `, [user1_id, user2_id, listing_id || null]);

  if (existing.rows.length) return res.json(existing.rows[0]);

  const result = await pool.query(`
    INSERT INTO conversations (user1_id, user2_id, listing_id)
    VALUES ($1, $2, $3) RETURNING *
  `, [user1_id, user2_id, listing_id || null]);

  res.status(201).json(result.rows[0]);
});

// ── GET /api/messages/unread/count ────────────────────────────────────────────
router.get("/unread/count", requireAuth, async (req, res) => {
  const uid = req.user.id;

  const result = await pool.query(`
    SELECT COUNT(DISTINCT m.conversation_id) AS count
    FROM   messages m
    JOIN   conversations c ON c.id = m.conversation_id
    WHERE  m.is_read = 0
    AND    m.sender_id != $1
    AND    (c.user1_id = $1 OR c.user2_id = $1)
  `, [uid]);

  res.json({ count: parseInt(result.rows[0].count) });
});

// ── POST /api/messages/:conversationId/read ───────────────────────────────────
router.post("/:conversationId/read", requireAuth, async (req, res) => {
  const uid    = req.user.id;
  const convId = parseInt(req.params.conversationId);

  const conv = await pool.query(
    "SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)",
    [convId, uid]
  );
  if (!conv.rows.length) return res.status(403).json({ error: "Access denied" });

  await pool.query(`
    UPDATE messages SET is_read = 1
    WHERE conversation_id = $1 AND sender_id != $2 AND is_read = 0
  `, [convId, uid]);

  res.json({ success: true });
});

// ── GET /api/messages/:conversationId ────────────────────────────────────────
router.get("/:conversationId", requireAuth, async (req, res) => {
  const uid    = req.user.id;
  const convId = parseInt(req.params.conversationId);

  const conv = await pool.query(
    "SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)",
    [convId, uid]
  );
  if (!conv.rows.length) return res.status(403).json({ error: "Access denied" });

  const c        = conv.rows[0];
  const other_id = c.user1_id === uid ? c.user2_id : c.user1_id;

  const messages = await pool.query(`
    SELECT m.*, u.name AS sender_name
    FROM   messages m
    JOIN   users u ON u.id = m.sender_id
    WHERE  m.conversation_id = $1
    ORDER  BY m.created_at ASC
  `, [convId]);

  const other = await pool.query(
    "SELECT id, name, phone FROM users WHERE id = $1",
    [other_id]
  );

  let listing = null;
  if (c.listing_id) {
    const lr = await pool.query(
      "SELECT id, title, price, images FROM listings WHERE id = $1",
      [c.listing_id]
    );
    listing = lr.rows[0] || null;
  }

  res.json({
    messages:     messages.rows,
    other:        other.rows[0],
    listing,
    conversation: c,
  });
});

// ── POST /api/messages/:conversationId ───────────────────────────────────────
router.post("/:conversationId", requireAuth, async (req, res) => {
  const uid    = req.user.id;
  const convId = parseInt(req.params.conversationId);

  const conv = await pool.query(
    "SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)",
    [convId, uid]
  );
  if (!conv.rows.length) return res.status(403).json({ error: "Access denied" });

  const { content, iv } = req.body;
  if (!content || !iv)
    return res.status(400).json({ error: "content and iv are required" });

  const result = await pool.query(`
    INSERT INTO messages (conversation_id, sender_id, content, iv)
    VALUES ($1, $2, $3, $4) RETURNING *
  `, [convId, uid, content, iv]);

  res.status(201).json(result.rows[0]);
});

module.exports = router;