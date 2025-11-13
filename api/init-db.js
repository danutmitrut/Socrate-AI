import { initDatabase } from '../lib/db.js';

/**
 * One-time database initialization endpoint
 * Call this once after deploying to create tables
 *
 * Security: In production, you should protect this endpoint or delete it after running once
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add a secret token check for security
  const authToken = req.headers['x-init-token'];
  if (process.env.DB_INIT_SECRET && authToken !== process.env.DB_INIT_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await initDatabase();

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully! Tables created.',
      tables: [
        'users',
        'ip_tracking',
        'sessions',
        'usage_logs'
      ]
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      details: error.message
    });
  }
}
