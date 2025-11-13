import { getUserByEmail, createUser, checkIpAbuse } from '../../lib/db.js';
import { hashPassword, isValidEmail, isValidPassword, getClientIp, createUserSession } from '../../lib/auth.js';
import { addToMailerlite } from '../../lib/mailerlite.js';

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

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Parola trebuie să aibă minimum 8 caractere' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Un cont cu acest email există deja' });
    }

    // Get client IP and check for abuse
    const clientIp = getClientIp(req);
    const ipCheck = await checkIpAbuse(clientIp);

    if (ipCheck) {
      // IP already has an account
      const hoursSinceCreation = (Date.now() - new Date(ipCheck.created_at).getTime()) / (1000 * 60 * 60);

      if (ipCheck.subscription_type === 'free' && hoursSinceCreation <= 72) {
        return res.status(403).json({
          error: 'Acest IP are deja un cont activ în perioada free de 72 ore. Te rugăm să aștepți sau să folosești un abonament plătit.',
          code: 'IP_LIMIT_ACTIVE_FREE'
        });
      }

      if (ipCheck.subscription_type === 'free' && hoursSinceCreation > 72) {
        return res.status(403).json({
          error: 'Perioada de testare gratuită a expirat pentru acest IP. Pentru a continua, te rugăm să achiziționezi un abonament.',
          code: 'IP_LIMIT_EXPIRED_FREE'
        });
      }

      // If they have a paid subscription, they can create another account
      // (This is allowed as they're paying customers)
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser(email.toLowerCase(), passwordHash, clientIp);

    // Add to Mailerlite newsletter
    await addToMailerlite(email.toLowerCase()).catch(err => {
      console.error('Mailerlite error (non-blocking):', err);
    });

    // Create session token
    const token = await createUserSession(user.id, user.email);

    return res.status(201).json({
      success: true,
      message: 'Cont creat cu succes! Ai 20 de mesaje gratuite în următoarele 72 de ore.',
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        messagesUsed: user.messages_used,
        messagesLimit: user.messages_limit,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Eroare la crearea contului. Te rugăm să încerci din nou.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
