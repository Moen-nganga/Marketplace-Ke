const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../db/database");

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing)
    return res.status(409).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)")
    .run(name, email.toLowerCase().trim(), phone || null, hashed);

  const token = jwt.sign(
    { id: result.lastInsertRowid, name, email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email, phone: phone || null },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  });
});

router.get("/me", require("../middleware/auth").requireAuth, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ── GET /api/auth/user/:id — public profile info ─────────────────────────────
router.get("/user/:id", (req, res) => {
  const user = db
    .prepare("SELECT id, name, phone, avatar, created_at FROM users WHERE id = ?")
    .get(req.params.id);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ── POST /api/auth/avatar — upload profile picture ───────────────────────────
const multer = require("multer");


const cloudinary             = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "sellanythingke/avatars",
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

router.post("/avatar", require("../middleware/auth").requireAuth, avatarUpload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const avatarUrl = req.file.path;
  db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatarUrl, req.user.id);

  res.json({ avatar: avatarUrl });
});

// ── GET /api/auth/google — redirect to Google login ──────────────────────────
router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account",
  });
  res.redirect(url);
});

// ── GET /api/auth/google/callback — handle Google response ───────────────────
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) return res.redirect("/login.html?error=cancelled");

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const { email, name, picture, id: googleId } = data;

    // Check if user already exists
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      // Create new user — no password since they use Google
      const result = db.prepare(`
        INSERT INTO users (name, email, password, avatar)
        VALUES (?, ?, ?, ?)
      `).run(name, email, "google_oauth_" + googleId, picture || null);

      user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    } else if (!user.avatar && picture) {
      // Update avatar if they didn't have one
      db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(picture, user.id);
      user.avatar = picture;
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    res.redirect(`/login.html?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user.id}&avatar=${encodeURIComponent(user.avatar || "")}`);

  } catch (e) {
    console.error("Google OAuth error:", e.message);
    res.redirect("/login.html?error=failed");
  }
});

module.exports = router;