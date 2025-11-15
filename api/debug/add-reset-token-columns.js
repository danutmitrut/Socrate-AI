import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Security check - require secret
  const dbInitSecret = req.headers['x-db-init-secret'] || req.query.db_init_secret;

  if (dbInitSecret !== process.env.DB_INIT_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing DB_INIT_SECRET'
    });
  }

  try {
    console.log('Adding reset_token and reset_token_expiry columns to users table...');

    // Add reset_token column (nullable)
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `;

    console.log('✅ Columns added successfully!');

    return res.status(200).json({
      success: true,
      message: 'Reset token columns added successfully',
      columns: ['reset_token', 'reset_token_expiry']
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
