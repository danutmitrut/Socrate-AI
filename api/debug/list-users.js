// ENDPOINT TEMPORAR DE DEBUG - ȘTERGE ÎNAINTE DE PRODUCȚIE!
// Listează userii din database pentru debugging

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all users (without passwords!)
    const result = await sql`
      SELECT
        id,
        email,
        subscription_type,
        messages_used,
        messages_limit,
        created_at,
        subscription_ends_at
      FROM users
      ORDER BY created_at DESC
    `;

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        messagesUsed: user.messages_used,
        messagesLimit: user.messages_limit,
        createdAt: user.created_at,
        subscriptionEndsAt: user.subscription_ends_at
      }))
    });

  } catch (error) {
    console.error('Debug list users error:', error);
    return res.status(500).json({
      error: 'Eroare la citirea userilor din database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      hint: 'Verifică că tabelul users există și că database-ul este conectat'
    });
  }
}
