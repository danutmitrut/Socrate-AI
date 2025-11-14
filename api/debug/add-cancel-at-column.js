import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Security check
  const secret = req.headers['x-db-init-secret'];
  if (secret !== process.env.DB_INIT_SECRET) {
    return res.status(403).json({ error: 'Forbidden - Invalid secret' });
  }

  try {
    // Add subscription_cancel_at column to users table
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMP
    `;

    console.log('✅ Added subscription_cancel_at column to users table');

    return res.status(200).json({
      success: true,
      message: 'Migration completed: subscription_cancel_at column added'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
