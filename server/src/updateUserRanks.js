const mysql = require('mysql2/promise');
require('dotenv').config();

const getRankTier = (points) => {
  if (points >= 2000) return 'Diamond';
  if (points >= 1500) return 'Gold';
  if (points >= 1000) return 'Silver';
  if (points >= 500) return 'Bronze';
  return 'Supporter';
};

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindmanthan'
  });

  try {
    console.log('Retrieving users to update ranks according to new criteria...');
    const [users] = await connection.query('SELECT id, name, points, rank_tier FROM users');
    
    for (const user of users) {
      const correctRank = getRankTier(user.points);
      if (user.rank_tier !== correctRank) {
        await connection.query('UPDATE users SET rank_tier = ? WHERE id = ?', [correctRank, user.id]);
        console.log(`Updated user ${user.name}: points=${user.points}, rank from '${user.rank_tier}' -> '${correctRank}'`);
      } else {
        console.log(`User ${user.name} rank already correct: points=${user.points}, rank='${user.rank_tier}'`);
      }
    }
    console.log('All user ranks successfully synchronized! 🎉');
  } catch (error) {
    console.error('Error migrating ranks:', error.message);
  } finally {
    await connection.end();
  }
}

main();
