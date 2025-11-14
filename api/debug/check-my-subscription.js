import { verifyToken } from '../../lib/auth.js';
import { getUserById } from '../../lib/db.js';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      email: user.email,
      subscriptionType: user.subscription_type,
      accountStatus: user.account_status,
      stripeCustomerId: user.stripe_customer_id,
      stripeSubscriptionId: user.stripe_subscription_id,
      subscriptionEndsAt: user.subscription_ends_at,
      subscriptionCancelAt: user.subscription_cancel_at,
      messagesUsed: user.messages_used,
      messagesLimit: user.messages_limit,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    return res.status(500).json({
      error: 'Failed to check subscription',
      details: error.message
    });
  }
}
