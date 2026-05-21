const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../db/database");

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
const fs     = require("fs");
const path2  = require("path");

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path2.join(__dirname, "../../public/uploads/avatars");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path2.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
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

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatarUrl, req.user.id);

  res.json({ avatar: avatarUrl });
});

module.exports = router;