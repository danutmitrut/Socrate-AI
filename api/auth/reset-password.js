import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token și parolă nouă sunt necesare' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Parola trebuie să conțină minim 8 caractere' });
    }

    // Find user with valid token
    const userResult = await sql`
      SELECT id, email, reset_token, reset_token_expiry
      FROM users
      WHERE reset_token = ${token}
    `;

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Token invalid sau expirat' });
    }

    const user = userResult.rows[0];

    // Check if token is expired
    const now = new Date();
    const expiry = new Date(user.reset_token_expiry);

    if (now > expiry) {
      return res.status(400).json({ error: 'Token-ul a expirat. Te rugăm să soliciți din nou un link de resetare.' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE id = ${user.id}
    `;

    console.log('Password reset successful for user:', user.email);

    return res.status(200).json({
      success: true,
      message: 'Parola a fost resetată cu succes'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: 'Eroare la resetarea parolei'
    });
  }
}
