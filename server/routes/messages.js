const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/messages/inbox — all conversations for logged in user ───────────
router.get("/inbox", requireAuth, (req, res) => {
  const uid = req.user.id;

  const conversations = db.prepare(`
    SELECT
      c.*,
      -- other person's info
      CASE WHEN c.user1_id = ? THEN u2.id   ELSE u1.id   END AS other_id,
      CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END AS other_name,
      -- listing info
      l.title  AS listing_title,
      l.images AS listing_images,
      -- last message
      (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT iv         FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_iv,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT sender_id  FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
    FROM conversations c
    JOIN users u1 ON u1.id = c.user1_id
    JOIN users u2 ON u2.id = c.user2_id
    LEFT JOIN listings l ON l.id = c.listing_id
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY last_message_at DESC
  `).all(uid, uid, uid, uid);

  res.json(conversations);
});

// ── POST /api/messages/conversation — start or get a conversation ────────────
router.post("/conversation", requireAuth, (req, res) => {
  const { other_id, listing_id } = req.body;
  const uid = req.user.id;

  if (!other_id)
    return res.status(400).json({ error: "other_id is required" });
  if (uid === parseInt(other_id))
    return res.status(400).json({ error: "Cannot message yourself" });

  // Always store user1_id as the smaller id for consistent UNIQUE constraint
  const user1_id = Math.min(uid, parseInt(other_id));
  const user2_id = Math.max(uid, parseInt(other_id));

  const existing = db.prepare(`
    SELECT * FROM conversations
    WHERE user1_id = ? AND user2_id = ? AND listing_id IS ?
  `).get(user1_id, user2_id, listing_id || null);

  if (existing) return res.json(existing);

  const result = db.prepare(`
    INSERT INTO conversations (user1_id, user2_id, listing_id)
    VALUES (?, ?, ?)
  `).run(user1_id, user2_id, listing_id || null);

  const conversation = db.prepare(
    "SELECT * FROM conversations WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json(conversation);
});

// ── GET /api/messages/:conversationId — get all messages ────────────────────
router.get("/:conversationId", requireAuth, (req, res) => {
  const uid    = req.user.id;
  const convId = parseInt(req.params.conversationId);

  // Make sure user is part of this conversation
  const conv = db.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)"
  ).get(convId, uid, uid);

  if (!conv) return res.status(403).json({ error: "Access denied" });

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM   messages m
    JOIN   users u ON u.id = m.sender_id
    WHERE  m.conversation_id = ?
    ORDER  BY m.created_at ASC
  `).all(convId);

  // Also return info about the other person and listing
  const other_id = conv.user1_id === uid ? conv.user2_id : conv.user1_id;
  const other    = db.prepare(
    "SELECT id, name, phone FROM users WHERE id = ?"
  ).get(other_id);

  const listing = conv.listing_id
    ? db.prepare("SELECT id, title, price, images FROM listings WHERE id = ?").get(conv.listing_id)
    : null;

  if (listing) listing.images = JSON.parse(listing.images || "[]");

  res.json({ messages, other, listing, conversation: conv });
});

// ── POST /api/messages/:conversationId — send a message ─────────────────────
router.post("/:conversationId", requireAuth, (req, res) => {
  const uid    = req.user.id;
  const convId = parseInt(req.params.conversationId);

  const conv = db.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)"
  ).get(convId, uid, uid);

  if (!conv) return res.status(403).json({ error: "Access denied" });

  const { content, iv } = req.body;

  if (!content || !iv)
    return res.status(400).json({ error: "content and iv are required" });

  const result = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, content, iv)
    VALUES (?, ?, ?, ?)
  `).run(convId, uid, content, iv);

  const message = db.prepare(
    "SELECT * FROM messages WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json(message);
});

module.exports = router;