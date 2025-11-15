import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    console.log('Adding reset_token columns...');

    // Add columns
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `;

    // Verify
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('reset_token', 'reset_token_expiry')
    `;

    return res.status(200).json({
      success: true,
      message: 'Reset token columns added successfully',
      columns: result.rows
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
