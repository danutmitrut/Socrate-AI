import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email este necesar' });
    }

    // Check if user exists
    const userResult = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    if (userResult.rows.length === 0) {
      // For security reasons, don't reveal if email exists or not
      // Always return success message
      return res.status(200).json({
        success: true,
        message: 'Dacă email-ul există în sistem, vei primi un link de resetare.'
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await sql`
      UPDATE users
      SET reset_token = ${resetToken},
          reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE id = ${user.id}
    `;

    // TODO: Send email with reset link
    // For now, we'll just log the reset link
    const resetLink = `${process.env.VERCEL_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
    console.log('Password Reset Link:', resetLink);
    console.log('Email:', email);

    // In production, you would send this via email (Mailersend, etc.)
    // For now, return success
    return res.status(200).json({
      success: true,
      message: 'Link de resetare trimis pe email',
      // Remove this in production - only for testing
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: 'Eroare la procesarea cererii'
    });
  }
}
