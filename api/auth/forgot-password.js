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

    // Generate reset link
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}`;

    console.log('Password Reset Link:', resetLink);
    console.log('Email:', email);

    // TODO: Send email with reset link via Mailersend
    // For now, we just log it and show it in console

    return res.status(200).json({
      success: true,
      message: 'Link de resetare trimis! Verifică consola serverului pentru link.',
      // In development, show the link directly for testing
      resetLink: resetLink
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: 'Eroare la procesarea cererii'
    });
  }
}
