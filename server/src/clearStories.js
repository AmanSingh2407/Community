const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindmanthan'
  });

  try {
    console.log('Connecting to database to clear dummy seeds...');
    
    // Clear stories
    const [resStories] = await connection.query('DELETE FROM stories');
    console.log(`Cleared stories table. Rows affected: ${resStories.affectedRows}`);

    // Clear likes & comments
    const [resLikes] = await connection.query('DELETE FROM likes');
    console.log(`Cleared likes table. Rows affected: ${resLikes.affectedRows}`);

    const [resComments] = await connection.query('DELETE FROM comments');
    console.log(`Cleared comments table. Rows affected: ${resComments.affectedRows}`);

    // Clear posts
    const [resPosts] = await connection.query('DELETE FROM posts');
    console.log(`Cleared posts table. Rows affected: ${resPosts.affectedRows}`);

    console.log('Successfully cleared all dummy data from database tables! 🎉');
  } catch (error) {
    console.error('Error clearing database seeds:', error.message);
  } finally {
    await connection.end();
  }
}

main();
