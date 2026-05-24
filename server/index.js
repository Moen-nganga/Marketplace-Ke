require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(express.static(path.join(__dirname, "../public")));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/ratings",  require("./routes/ratings"));
app.use("/api/reports",  require("./routes/reports"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/categories", (req, res) => {
  const db      = require("./db/database");
  const parents = db.prepare("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id").all();
  const result  = parents.map(p => ({
    ...p,
    children: db.prepare("SELECT * FROM categories WHERE parent_id = ? ORDER BY id").all(p.id),
  }));
  res.json(result);
});

// ── Catch-all → serve frontend ───────────────────────────────────────────────
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  SellAnythingKE running at http://localhost:${PORT}\n`);
});