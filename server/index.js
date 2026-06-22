require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(express.static(path.join(__dirname, "../public")));

// Handle all HTML pages
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "../public", req.path);
  const fs = require("fs");
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",            require("./routes/auth"));
app.use("/api/listings",        require("./routes/listings"));
app.use("/api/ratings",         require("./routes/ratings"));
app.use("/api/messages",        require("./routes/messages"));
app.use("/api/notifications",   require("./routes/notifications"));
app.use("/api/reports",         require("./routes/reports"));
app.use("/api/saved",           require("./routes/saved"));
app.use("/api/search",          require("./routes/search"));
app.use("/api/recently-viewed", require("./routes/recently-viewed"));
app.use("/api/categories",      async (req, res) => {
  const pool    = require("./db/postgres");
  const parents = await pool.query(
    "SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id"
  );
  const result = await Promise.all(parents.rows.map(async p => {
    const children = await pool.query(
      "SELECT * FROM categories WHERE parent_id = $1 ORDER BY id",
      [p.id]
    );
    return { ...p, children: children.rows };
  }));
  res.json(result);
});

// ── Catch-all → serve frontend ────────────────────────────────────────────────
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  Marketplace Ke running at http://localhost:${PORT}\n`);
});