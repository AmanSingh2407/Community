const db = require('../config/database');

const runMigration = async () => {
  try {
    console.log('Starting migration to create community_messages table...');

    // Create table inheriting database default charset and collation
    await db.query(`
      CREATE TABLE IF NOT EXISTS community_messages (
        id VARCHAR(36) PRIMARY KEY,
        community_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        message TEXT,
        media_url VARCHAR(255),
        media_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('Table community_messages created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
