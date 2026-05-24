const db = require('./server/db/database');
const fs = require('fs');

try {
  const data = {
    users:     db.prepare('SELECT * FROM users').all(),
    listings:  db.prepare('SELECT * FROM listings').all(),
    ratings:   db.prepare('SELECT * FROM ratings').all(),
    conversations: db.prepare('SELECT * FROM conversations').all(),
    messages:  db.prepare('SELECT * FROM messages').all(),
  };
  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('✅ Backup saved to backup.json');
  console.log(`   Users: ${data.users.length}`);
  console.log(`   Listings: ${data.listings.length}`);
  console.log(`   Ratings: ${data.ratings.length}`);
  console.log(`   Messages: ${data.messages.length}`);
} catch (e) {
  console.error('Backup failed:', e.message);
}