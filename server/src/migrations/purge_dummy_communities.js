const db = require('../config/database');

const runMigration = async () => {
  try {
    console.log('Purging dummy seeded communities from Clever Cloud MySQL...');
    
    // Deleting communities automatically deletes memberships in community_members due to ON DELETE CASCADE
    const [result] = await db.query("DELETE FROM communities WHERE id IN ('c1', 'c2', 'c3')");
    
    console.log(`Successfully deleted ${result.affectedRows} dummy communities.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
