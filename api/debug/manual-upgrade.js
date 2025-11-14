// ENDPOINT TEMPORAR DE DEBUG - ȘTERGE ÎNAINTE DE PRODUCȚIE!
// Manual upgrade user to paid subscription

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require DEBUG_SECRET to prevent unauthorized upgrades
  const debugSecret = req.headers['x-debug-secret'] || req.body?.debugSecret;

  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({
      error: 'DEBUG_SECRET not configured',
      message: 'Set DEBUG_SECRET in Vercel environment variables to use this endpoint'
    });
  }

  if (debugSecret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing DEBUG_SECRET. Send via x-debug-secret header or debugSecret in body.'
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        usage: 'POST { "email": "user@example.com" }'
      });
    }

    // Get user
    const userResult = await sql`
      SELECT * FROM users WHERE LOWER(email) = LOWER(${email})
    `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: `User ${email} not found` });
    }

    const user = userResult.rows[0];

    // Calculate subscription end date (30 days from now)
    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Upgrade to paid
    await sql`
      UPDATE users
      SET
        subscription_type = 'paid',
        subscription_ends_at = ${subscriptionEndsAt},
        messages_limit = 300,
        messages_used = 0,
        last_reset_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    return res.status(200).json({
      success: true,
      message: `✅ User ${email} upgraded to PAID successfully!`,
      userId: user.id,
      email: user.email,
      subscriptionType: 'paid',
      messagesLimit: 300,
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      nextStep: 'Refresh the app and check the header - should show 0/300 messages'
    });

  } catch (error) {
    console.error('Manual upgrade error:', error);
    return res.status(500).json({
      error: 'Failed to upgrade user',
      details: error.message
    });
  }
}
