const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/saved — get all saved listings ───────────────────────────────────
router.get("/", requireAuth, (req, res) => {
  const listings = db.prepare(`
    SELECT l.*, u.name AS seller_name,
           c.name AS category_name, c.icon AS category_icon
    FROM   saved_listings s
    JOIN   listings     l ON l.id = s.listing_id
    JOIN   users        u ON u.id = l.user_id
    JOIN   categories   c ON c.id = l.category_id
    WHERE  s.user_id = ? AND l.status != 'deleted'
    ORDER  BY s.saved_at DESC
  `).all(req.user.id)
    .map(row => ({
      ...row,
      images: JSON.parse(row.images || "[]"),
      tags:   JSON.parse(row.tags   || "[]"),
    }));

  res.json(listings);
});

// ── GET /api/saved/check/:listingId — MUST be before /:listingId ──────────────
router.get("/check/:listingId", requireAuth, (req, res) => {
  const saved = db.prepare(
    "SELECT listing_id FROM saved_listings WHERE user_id = ? AND listing_id = ?"
  ).get(req.user.id, req.params.listingId);
  res.json({ saved: !!saved });
});

// ── POST /api/saved/:listingId — save a listing ───────────────────────────────
router.post("/:listingId", requireAuth, (req, res) => {
  const { listingId } = req.params;
  const uid = req.user.id;

  const listing = db.prepare(
    "SELECT id, user_id FROM listings WHERE id = ? AND status != 'deleted'"
  ).get(listingId);

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.user_id === uid) return res.status(400).json({ error: "You cannot save your own listing" });

  const existing = db.prepare(
    "SELECT listing_id FROM saved_listings WHERE user_id = ? AND listing_id = ?"
  ).get(uid, listingId);
  if (existing) return res.status(409).json({ error: "Already saved" });

  db.prepare("INSERT INTO saved_listings (user_id, listing_id) VALUES (?, ?)").run(uid, listingId);
  res.json({ success: true, saved: true });
});

// ── DELETE /api/saved/:listingId — unsave a listing ──────────────────────────
router.delete("/:listingId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?")
    .run(req.user.id, req.params.listingId);
  res.json({ success: true, saved: false });
});

module.exports = router;