const mysql = require('mysql2/promise');

const cleverCloudUri = 'mysql://u0cfh6e1trxf8jdp:2kIde3vMx70x14hicfY3@bmbdho6tvov2qwf9qpkd-mysql.services.clever-cloud.com:3306/bmbdho6tvov2qwf9qpkd';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runCleverCloudMigrations = async () => {
  let connection;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`Connecting directly to Clever Cloud (Attempt ${attempts}/${maxAttempts})...`);
      connection = await mysql.createConnection(cleverCloudUri);
      console.log('Successfully connected to Clever Cloud!');
      break; // Connected! Break loop.
    } catch (err) {
      if (err.code === 'ER_USER_LIMIT_REACHED') {
        console.warn(`Connection limit reached. Retrying in 2 seconds...`);
        await wait(2000);
      } else {
        console.error('Fatal connection error:', err);
        process.exit(1);
      }
    }
  }

  if (!connection) {
    console.error('Could not acquire connection to Clever Cloud after maximum retries. Please try again in a moment.');
    process.exit(1);
  }

  try {
    // 1. Create table
    console.log('Creating community_messages table...');
    await connection.query(`
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

    // 2. Purge dummy communities
    console.log('Purging dummy communities (c1, c2, c3)...');
    const [result] = await connection.query("DELETE FROM communities WHERE id IN ('c1', 'c2', 'c3')");
    console.log(`Successfully purged ${result.affectedRows} dummy communities.`);

    console.log('All Clever Cloud migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Clever Cloud migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runCleverCloudMigrations();
