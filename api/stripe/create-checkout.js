import Stripe from 'stripe';
import { authenticateRequest } from '../../lib/auth.js';
import { getUserById } from '../../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    // Authenticate user
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Neautentificat' });
    }

    const user = await getUserById(auth.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id.toString()
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your Stripe Price ID for 29 RON/month
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}?canceled=true`,
      metadata: {
        userId: user.id.toString()
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString()
        }
      }
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Eroare la crearea sesiunii de plată',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
