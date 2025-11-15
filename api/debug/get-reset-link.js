import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    // Get user's reset token
    const result = await sql`
      SELECT email, reset_token, reset_token_expiry
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.reset_token) {
      return res.status(404).json({ error: 'No reset token found. Request a new password reset.' });
    }

    // Check if expired
    const now = new Date();
    const expiry = new Date(user.reset_token_expiry);
    const isExpired = now > expiry;

    const resetLink = `https://socrate-ai-8teu.vercel.app/reset-password.html?token=${user.reset_token}`;

    return res.status(200).json({
      email: user.email,
      resetLink: resetLink,
      expiresAt: user.reset_token_expiry,
      isExpired: isExpired,
      timeRemaining: isExpired ? 'Expired' : `${Math.round((expiry - now) / 60000)} minutes`
    });

  } catch (error) {
    console.error('Get reset link error:', error);
    return res.status(500).json({
      error: 'Failed to get reset link',
      details: error.message
    });
  }
}
