import { verifyToken } from '../../lib/auth.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Clear test subscription data
    const result = await sql`
      UPDATE users
      SET stripe_subscription_id = NULL,
          stripe_customer_id = NULL,
          subscription_type = 'free',
          subscription_ends_at = NULL,
          subscription_cancel_at = NULL,
          messages_limit = 20,
          messages_used = 0,
          account_status = 'active'
      WHERE id = ${userId}
      RETURNING email, subscription_type, account_status
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Test subscription cleared successfully. Account reset to free tier.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Clear test subscription error:', error);
    return res.status(500).json({
      error: 'Failed to clear test subscription',
      details: error.message
    });
  }
}
