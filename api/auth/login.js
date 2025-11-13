import { getUserByEmail } from '../../lib/db.js';
import { verifyPassword, isValidEmail, createUserSession } from '../../lib/auth.js';

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
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalid' });
    }

    // Get user
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    // Check if free tier expired
    const hoursSinceCreation = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
    const freeExpired = user.subscription_type === 'free' && hoursSinceCreation > 72;

    // Create session token
    const token = await createUserSession(user.id, user.email);

    return res.status(200).json({
      success: true,
      message: 'Autentificare reușită',
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        messagesUsed: user.messages_used,
        messagesLimit: user.messages_limit,
        createdAt: user.created_at,
        subscriptionEndsAt: user.subscription_ends_at,
        freeExpired
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Eroare la autentificare. Te rugăm să încerci din nou.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
