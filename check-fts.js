const db = require('./server/db/database');

console.log('\n--- All listings in DB ---');
const listings = db.prepare('SELECT id, title, status FROM listings').all();
console.log(listings);

console.log('\n--- All entries in FTS index ---');
try {
  const fts = db.prepare('SELECT rowid, title FROM listings_fts').all();
  console.log(fts);
} catch (e) {
  console.log('FTS error:', e.message);
}

console.log('\n--- FTS search test for "mobile" ---');
try {
  const results = db.prepare(`
    SELECT rowid, title FROM listings_fts
    WHERE listings_fts MATCH '"mobile"*'
  `).all();
  console.log(results);
} catch (e) {
  console.log('Search error:', e.message);
}