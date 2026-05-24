const db  = require('./server/db/database');
const fs  = require('fs');
const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'));

db.pragma('foreign_keys = OFF');

const restoreUsers = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, phone, password, avatar, created_at)
  VALUES (@id, @name, @email, @phone, @password, @avatar, @created_at)
`);
const restoreListings = db.prepare(`
  INSERT OR IGNORE INTO listings
  (id, user_id, category_id, title, description, reason, price, condition, location, images, tags, status, views, created_at)
  VALUES (@id, @user_id, @category_id, @title, @description, @reason, @price, @condition, @location, @images, @tags, @status, @views, @created_at)
`);
const restoreRatings = db.prepare(`
  INSERT OR IGNORE INTO ratings (id, rater_id, rated_id, score, review, created_at)
  VALUES (@id, @rater_id, @rated_id, @score, @review, @created_at)
`);
const restoreConvs = db.prepare(`
  INSERT OR IGNORE INTO conversations (id, user1_id, user2_id, listing_id, created_at)
  VALUES (@id, @user1_id, @user2_id, @listing_id, @created_at)
`);
const restoreMsgs = db.prepare(`
  INSERT OR IGNORE INTO messages (id, conversation_id, sender_id, content, iv, is_read, created_at)
  VALUES (@id, @conversation_id, @sender_id, @content, @iv, @is_read, @created_at)
`);

const run = db.transaction(() => {
  data.users.forEach(u        => restoreUsers.run(u));
  data.listings.forEach(l     => restoreListings.run(l));
  data.ratings.forEach(r      => restoreRatings.run(r));
  data.conversations.forEach(c => restoreConvs.run(c));
  data.messages.forEach(m     => restoreMsgs.run(m));
});

try {
  run();
  db.pragma('foreign_keys = ON');
  console.log('✅ Data restored successfully');
  console.log(`   Users: ${data.users.length}`);
  console.log(`   Listings: ${data.listings.length}`);
} catch (e) {
  console.error('Restore failed:', e.message);
}