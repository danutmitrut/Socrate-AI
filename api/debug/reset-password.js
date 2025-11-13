// ENDPOINT TEMPORAR DE DEBUG - ȘTERGE ÎNAINTE DE PRODUCȚIE!
// Folosit doar pentru testare - resetează parola unui user

import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, newPassword, debugSecret } = req.body;

    // Validare input
    if (!email || !newPassword) {
      return res.status(400).json({
        error: 'Email și parolă nouă sunt obligatorii',
        usage: 'POST cu { "email": "user@example.com", "newPassword": "newpass123" }'
      });
    }

    // Verificare lungime parolă
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Parola trebuie să aibă minim 6 caractere'
      });
    }

    // Optional: verifică un secret pentru securitate suplimentară
    // Poți seta DEBUG_SECRET în Vercel Environment Variables
    if (process.env.DEBUG_SECRET && debugSecret !== process.env.DEBUG_SECRET) {
      return res.status(401).json({
        error: 'Debug secret invalid',
        hint: 'Setează DEBUG_SECRET în Vercel sau trimite debugSecret corect'
      });
    }

    // Verifică dacă user-ul există
    const userResult = await sql`
      SELECT id, email FROM users WHERE LOWER(email) = LOWER(${email})
    `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: `User cu email-ul ${email} nu a fost găsit în baza de date`
      });
    }

    const user = userResult.rows[0];

    // Hash noua parolă
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update parola în baza de date
    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${user.id}
    `;

    return res.status(200).json({
      success: true,
      message: `✅ Parola pentru ${email} a fost resetată cu succes!`,
      userId: user.id,
      email: user.email,
      newPasswordPreview: `${newPassword.substring(0, 3)}***`,
      nextStep: 'Acum te poți loga cu noua parolă'
    });

  } catch (error) {
    console.error('Debug reset password error:', error);
    return res.status(500).json({
      error: 'Eroare la resetarea parolei',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
