import Stripe from 'stripe';
import { verifyToken } from '../../lib/auth.js';
import { getUserById } from '../../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Get user from database
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has an active subscription
    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe (at period end)
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    );

    // Calculate end date (fallback to 30 days if not available)
    let endsAt;
    if (subscription.current_period_end && subscription.current_period_end > 0) {
      endsAt = subscription.current_period_end * 1000; // Convert to milliseconds
    } else if (subscription.cancel_at && subscription.cancel_at > 0) {
      endsAt = subscription.cancel_at * 1000;
    } else {
      // Fallback: 30 days from now
      endsAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at period end',
      endsAt: endsAt
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
}
