require("dotenv").config();
const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const pool     = require("../db/postgres");
const { requireAuth } = require("../middleware/auth");
const cloudinary             = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "Marketplace Ke/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 200, height: 200, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length)
      return res.status(409).json({ error: "This email is already registered. Please log in instead." });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email.toLowerCase().trim(), phone || null, hashed]
    );

    const user  = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (e) {
    console.error("Register error:", e.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    const user   = result.rows[0];

    if (!user)
      return res.status(404).json({ error: "No account found with this email address" });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = $1",
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});

// ── GET /api/auth/user/:id — public profile ──────────────────────────────────
router.get("/user/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, phone, avatar, created_at FROM users WHERE id = $1",
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});

// ── POST /api/auth/avatar ────────────────────────────────────────────────────
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const avatarUrl = req.file.path;
  await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatarUrl, req.user.id]);
  res.json({ avatar: avatarUrl });
});

// ── Google OAuth ─────────────────────────────────────────────────────────────
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account",
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/login.html?error=cancelled");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2   = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    const { email, name, picture, id: googleId } = data;

    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user   = result.rows[0];

    if (!user) {
      const ins = await pool.query(
        "INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, email, "google_oauth_" + googleId, picture || null]
      );
      user = ins.rows[0];
    } else if (!user.avatar && picture) {
      await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [picture, user.id]);
      user.avatar = picture;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`/login.html?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user.id}&avatar=${encodeURIComponent(user.avatar || "")}`);
  } catch (e) {
    console.error("Google OAuth error:", e.message);
    res.redirect("/login.html?error=failed");
  }
});

module.exports = router;