// Script de validare Environment Variables
// Rulează: GET https://socrate-ai.vercel.app/api/validate-env

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requiredVars = {
    // OpenAI
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'ASSISTANT_ID': process.env.ASSISTANT_ID,

    // JWT
    'JWT_SECRET': process.env.JWT_SECRET,

    // Stripe
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_PUBLISHABLE_KEY': process.env.STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_PRICE_ID': process.env.STRIPE_PRICE_ID,

    // Database (Vercel Postgres)
    'POSTGRES_URL': process.env.POSTGRES_URL,
    'POSTGRES_USER': process.env.POSTGRES_USER,
    'POSTGRES_HOST': process.env.POSTGRES_HOST,
    'POSTGRES_PASSWORD': process.env.POSTGRES_PASSWORD,
    'POSTGRES_DATABASE': process.env.POSTGRES_DATABASE,

    // App Config
    'APP_URL': process.env.APP_URL,

    // Optional - Mailerlite
    'MAILERLITE_API_KEY': process.env.MAILERLITE_API_KEY
  };

  const results = {};
  const missing = [];
  const configured = [];

  for (const [key, value] of Object.entries(requiredVars)) {
    const exists = !!value;
    const isOptional = key === 'MAILERLITE_API_KEY' || key === 'MAILERLITE_GROUP_ID';

    results[key] = {
      exists,
      optional: isOptional,
      valuePreview: exists ? `${value.substring(0, 10)}...` : 'NOT SET'
    };

    if (!exists && !isOptional) {
      missing.push(key);
    } else if (exists) {
      configured.push(key);
    }
  }

  const allConfigured = missing.length === 0;

  return res.status(allConfigured ? 200 : 500).json({
    status: allConfigured ? 'OK' : 'INCOMPLETE',
    message: allConfigured
      ? '✅ Toate environment variables necesare sunt configurate!'
      : `⚠️ Lipsesc ${missing.length} environment variables necesare`,
    configured: {
      count: configured.length,
      variables: configured
    },
    missing: {
      count: missing.length,
      variables: missing
    },
    details: results,
    nextSteps: missing.length > 0 ? [
      '1. Deschide Vercel Dashboard → Settings → Environment Variables',
      '2. Adaugă variabilele lipsă din lista de mai jos',
      '3. Redeploy aplicația',
      '4. Verifică din nou la: /api/validate-env'
    ] : [
      '✅ Setup complet! Acum poți testa aplicația.',
      '📖 Vezi STRIPE_SETUP.md pentru detalii despre testare'
    ]
  });
}
