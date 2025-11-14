import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Security check
  const secret = req.headers['x-db-init-secret'];
  if (secret !== process.env.DB_INIT_SECRET) {
    return res.status(403).json({ error: 'Forbidden - Invalid secret' });
  }

  try {
    // Add account_status column to users table
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
      CHECK (account_status IN ('active', 'dormant'))
    `;

    // Set all existing users to 'active' status
    await sql`
      UPDATE users
      SET account_status = 'active'
      WHERE account_status IS NULL
    `;

    console.log('✅ Added account_status column to users table');
    console.log('✅ Set all existing users to active status');

    return res.status(200).json({
      success: true,
      message: 'Migration completed: account_status column added with default active status'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
