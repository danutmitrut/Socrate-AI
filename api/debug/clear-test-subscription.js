import { verifyToken } from '../../lib/auth.js';
import { query } from '../../lib/db.js';

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
    const result = await query(
      `UPDATE users
       SET stripe_subscription_id = NULL,
           stripe_customer_id = NULL,
           subscription_type = 'free',
           subscription_ends_at = NULL,
           subscription_cancel_at = NULL,
           messages_limit = 20,
           account_status = 'active'
       WHERE id = $1
       RETURNING email, subscription_type, account_status`,
      [userId]
    );

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
