# Socrate AI - Asistent Conversațional Maieutic

O experiență imersivă în filozofia socratică, cu autentificare, abonamente și protecție anti-abuz.

## Caracteristici

### Autentificare & Securitate
- ✅ Sistem complet de autentificare (email/parolă)
- ✅ Protecție anti-abuz bazată pe IP (1 cont gratuit per IP)
- ✅ JWT tokens pentru sesiuni sigure
- ✅ Parole criptate cu bcrypt

### Modele de Abonament
- **Free Tier**: 72 ore acces + 20 mesaje gratuite
- **Paid Tier**: 300 mesaje/lună la 29 RON
- Tracking automat al utilizării
- Rate limiting implementat

### Integrări
- **OpenAI GPT-4**: Asistent conversațional maieutic
- **Stripe**: Procesare plăți securizată
- **Mailerlite**: Newsletter automation
- **Vercel Postgres**: Database scalabilă

### Stack Tehnologic
- **Frontend**: HTML, Alpine.js, Tailwind CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel Postgres
- **Payments**: Stripe
- **Hosting**: Vercel

## Structura Proiectului

```
socrate-ai/
├── index.html              # Main chat interface
├── auth.html              # Login/Register page
├── app.js                 # Frontend auth & chat logic
├── api/
│   ├── chat.js           # Chat endpoint with auth & rate limiting
│   ├── auth/
│   │   ├── register.js   # User registration
│   │   ├── login.js      # User login
│   │   └── me.js         # Get current user
│   ├── stripe/
│   │   ├── create-checkout.js  # Create Stripe checkout
│   │   └── webhook.js          # Handle Stripe webhooks
│   └── init-db.js        # Database initialization
├── lib/
│   ├── db.js             # Database functions
│   ├── auth.js           # Authentication helpers
│   └── mailerlite.js     # Mailerlite integration
├── .env.example          # Environment variables template
└── DEPLOYMENT_GUIDE.md   # Detailed deployment instructions

```

## Quick Start

### 1. Instalare Dependințe
```bash
npm install
```

### 2. Configurare Environment Variables
Copiază `.env.example` în `.env` și completează valorile:
```bash
cp .env.example .env
```

### 3. Deploy pe Vercel
```bash
vercel --prod
```

### 4. Inițializare Database
```bash
curl -X POST https://your-domain.vercel.app/api/init-db
```

## Documentație Completă

Vezi [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) pentru:
- Configurare detaliată Stripe
- Setup Mailerlite
- Configurare Vercel Postgres
- Troubleshooting
- Calcule de costuri
- Best practices

## Dezvoltare Locală

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables
vercel env pull

# Run development server
vercel dev
```

## Costuri Estimate

Pentru 100 useri/lună:
- **Infrastructură**: Free (Vercel free tier)
- **OpenAI API**: ~350 RON/lună
- **Stripe fees**: ~2 RON per tranzacție
- **Profit potential**: 270+ RON/lună la 10+ paid users

## Securitate

- Password hashing cu bcrypt (10 rounds)
- JWT tokens cu expirare (30 zile)
- IP-based anti-abuse protection
- Stripe webhook signature verification
- SQL injection protection (parametrizat queries)
- XSS protection (HTML escaping)

## Licență

Private - © 2024 Dănuț Mitruț - Hello Business Ecosystem

## Contact

- Website: [socrate-ai.vercel.app](https://socrate-ai.vercel.app)
- GitHub: [@danutmitrut](https://github.com/danutmitrut)