import { sql } from '@vercel/postgres';

/**
 * Initialize database tables
 * Run this once to set up the database schema
 */
export async function initDatabase() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
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

    // IP tracking table for anti-abuse
    await sql`
      CREATE TABLE IF NOT EXISTS ip_tracking (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, user_id)
      )
    `;

    // User sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Usage logs for analytics
    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_count INTEGER DEFAULT 1,
        thread_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ip_tracking_ip ON ip_tracking(ip_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id)`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return result.rows[0] || null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${userId} LIMIT 1
  `;
  return result.rows[0] || null;
}

/**
 * Create new user
 */
export async function createUser(email, passwordHash, ipAddress) {
  const result = await sql`
    INSERT INTO users (email, password_hash, messages_limit)
    VALUES (${email}, ${passwordHash}, 20)
    RETURNING *
  `;

  const user = result.rows[0];

  // Track IP address
  await sql`
    INSERT INTO ip_tracking (ip_address, user_id)
    VALUES (${ipAddress}, ${user.id})
  `;

  return user;
}

/**
 * Check if IP has already created a free account
 */
export async function checkIpAbuse(ipAddress) {
  const result = await sql`
    SELECT u.*, ip.created_at as ip_registered_at
    FROM ip_tracking ip
    JOIN users u ON ip.user_id = u.id
    WHERE ip.ip_address = ${ipAddress}
    ORDER BY ip.created_at DESC
    LIMIT 1
  `;

  return result.rows[0] || null;
}

/**
 * Update user subscription to paid
 */
export async function updateUserSubscription(userId, subscriptionData) {
  const { stripeCustomerId, stripeSubscriptionId, subscriptionEndsAt } = subscriptionData;

  const result = await sql`
    UPDATE users
    SET
      subscription_type = 'paid',
      subscription_ends_at = ${subscriptionEndsAt},
      stripe_customer_id = ${stripeCustomerId},
      stripe_subscription_id = ${stripeSubscriptionId},
      messages_limit = 300,
      messages_used = 0,
      last_reset_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
    RETURNING *
  `;

  return result.rows[0];
}

/**
 * Increment message usage for user
 */
export async function incrementMessageUsage(userId) {
  const result = await sql`
    UPDATE users
    SET messages_used = messages_used + 1
    WHERE id = ${userId}
    RETURNING *
  `;

  return result.rows[0];
}

/**
 * Check if user has exceeded their message limit
 */
export async function checkUserLimit(userId) {
  const user = await getUserById(userId);

  if (!user) return { allowed: false, reason: 'User not found' };

  // Check if free tier has expired (72 hours)
  if (user.subscription_type === 'free') {
    const hoursSinceCreation = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 72) {
      return { allowed: false, reason: 'Free tier expired (72h)', user };
    }
  }

  // Check if paid subscription has expired
  if (user.subscription_type === 'paid' && user.subscription_ends_at) {
    if (new Date() > new Date(user.subscription_ends_at)) {
      return { allowed: false, reason: 'Subscription expired', user };
    }
  }

  // Check message limit
  if (user.messages_used >= user.messages_limit) {
    return {
      allowed: false,
      reason: user.subscription_type === 'free'
        ? 'Free tier limit reached (20 messages)'
        : 'Monthly limit reached (300 messages)',
      user
    };
  }

  return { allowed: true, user };
}

/**
 * Reset monthly usage for paid users (called by cron job)
 */
export async function resetMonthlyUsage() {
  const result = await sql`
    UPDATE users
    SET
      messages_used = 0,
      last_reset_at = CURRENT_TIMESTAMP
    WHERE
      subscription_type = 'paid'
      AND subscription_ends_at > CURRENT_TIMESTAMP
      AND (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_reset_at)) / 86400) >= 30
    RETURNING *
  `;

  return result.rows;
}

/**
 * Log message usage
 */
export async function logUsage(userId, threadId) {
  await sql`
    INSERT INTO usage_logs (user_id, thread_id, message_count)
    VALUES (${userId}, ${threadId}, 1)
  `;
}

/**
 * Create session token
 */
export async function createSession(userId, token, expiresAt) {
  const result = await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
    RETURNING *
  `;

  return result.rows[0];
}

/**
 * Get session by token
 */
export async function getSessionByToken(token) {
  const result = await sql`
    SELECT s.*, u.*
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > CURRENT_TIMESTAMP
    LIMIT 1
  `;

  return result.rows[0] || null;
}

/**
 * Delete expired sessions
 */
export async function cleanExpiredSessions() {
  await sql`
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP
  `;
}
