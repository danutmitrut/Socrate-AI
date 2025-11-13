// ENDPOINT TEMPORAR DE DEBUG - ȘTERGE ÎNAINTE DE PRODUCȚIE!
// ATENȚIE: ȘTERGE TOATE DATELE DIN DATABASE!

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // WARNING: ȘTERGE TOATE TABELELE!
    console.log('⚠️ ȘTERGERE TABELE - DROP ALL TABLES');

    // Drop tables în ordine inversă (din cauza foreign keys)
    await sql`DROP TABLE IF EXISTS usage_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS ip_tracking CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    console.log('✅ Tabele șterse cu succes');

    // Recreează tabelele cu schema corectă
    console.log('🔨 RECREARE TABELE');

    // Users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'paid')),
        subscription_ends_at TIMESTAMP,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        messages_used INTEGER DEFAULT 0,
        messages_limit INTEGER DEFAULT 20,
        last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // IP tracking table
    await sql`
      CREATE TABLE ip_tracking (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, user_id)
      )
    `;

    // Sessions table
    await sql`
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Usage logs table
    await sql`
      CREATE TABLE usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_count INTEGER DEFAULT 1,
        thread_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX idx_users_email ON users(email)`;
    await sql`CREATE INDEX idx_ip_tracking_ip ON ip_tracking(ip_address)`;
    await sql`CREATE INDEX idx_sessions_token ON sessions(token)`;
    await sql`CREATE INDEX idx_usage_logs_user ON usage_logs(user_id)`;

    console.log('✅ Tabele recreate cu succes');

    return res.status(200).json({
      success: true,
      message: '✅ Database resetat complet! Toate tabelele au fost șterse și recreate.',
      warning: '⚠️ TOATE DATELE VECHI AU FOST ȘTERSE!',
      tables: ['users', 'ip_tracking', 'sessions', 'usage_logs'],
      nextStep: 'Acum poți să te înregistrezi cu un cont nou'
    });

  } catch (error) {
    console.error('Database reset error:', error);
    return res.status(500).json({
      error: 'Eroare la resetarea database-ului',
      details: error.message
    });
  }
}
