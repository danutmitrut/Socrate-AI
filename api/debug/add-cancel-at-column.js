import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Security check - use DEBUG_SECRET like other debug endpoints
  const debugSecret = req.headers['x-debug-secret'];

  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({
      error: 'DEBUG_SECRET not configured',
      message: 'Set DEBUG_SECRET in Vercel environment variables to use this endpoint'
    });
  }

  if (debugSecret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing DEBUG_SECRET. Send via x-debug-secret header.'
    });
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
