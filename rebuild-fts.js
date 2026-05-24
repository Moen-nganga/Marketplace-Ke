const db = require('./server/db/database');

try {
  db.exec('DELETE FROM listings_fts');
  console.log('✅ Cleared FTS index');

  db.exec(`
    INSERT INTO listings_fts(rowid, title, description, tags, location)
    SELECT id, title, description, COALESCE(tags, '[]'), COALESCE(location, '')
    FROM listings WHERE status != 'deleted'
  `);
  console.log('✅ FTS index rebuilt successfully');

  const count = db.prepare('SELECT COUNT(*) AS n FROM listings_fts').get().n;
  console.log(`✅ Indexed ${count} listing(s)`);
} catch (e) {
  console.error('Error:', e.message);
}