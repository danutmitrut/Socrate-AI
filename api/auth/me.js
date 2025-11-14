import { authenticateRequest } from '../../lib/auth.js';
import { getUserById } from '../../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Neautentificat', code: 'UNAUTHORIZED' });
    }

    const user = await getUserById(auth.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Check if free tier expired
    const hoursSinceCreation = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
    const freeExpired = user.subscription_type === 'free' && hoursSinceCreation > 72;

    // Check if paid subscription expired
    const paidExpired = user.subscription_type === 'paid' &&
      user.subscription_ends_at &&
      new Date() > new Date(user.subscription_ends_at);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        messagesUsed: user.messages_used,
        messagesLimit: user.messages_limit,
        createdAt: user.created_at,
        subscriptionEndsAt: user.subscription_ends_at,
        subscriptionCancelAt: user.subscription_cancel_at,
        freeExpired,
        paidExpired,
        hoursRemaining: user.subscription_type === 'free' ? Math.max(0, 72 - hoursSinceCreation).toFixed(1) : null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Eroare la obținerea datelor utilizatorului',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
