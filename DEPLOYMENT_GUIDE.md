# Socrate AI - Ghid de Deployment

## Prezentare Generală

Socrate AI este acum un asistent conversațional complet, cu:
- ✅ Autentificare cu email/parolă
- ✅ Free tier: 72 ore, 20 mesaje
- ✅ Paid tier: 300 mesaje/lună la 29 RON
- ✅ Protecție anti-abuz pe IP
- ✅ Integrare Stripe pentru plăți
- ✅ Integrare Mailerlite pentru newsletter
- ✅ Rate limiting automat

---

## Pași de Deployment

### 1. Configurare Vercel Postgres

1. Mergi pe [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selectează proiectul **socrate-ai**
3. Du-te la tab-ul **Storage**
4. Click pe **Create Database** → Selectează **Postgres**
5. Alege **Free tier** (256MB - suficient pentru 100+ useri)
6. După creare, Vercel va adăuga automat toate variabilele `POSTGRES_*` în Environment Variables

### 2. Configurare Environment Variables

Du-te la **Settings** → **Environment Variables** și adaugă:

#### OpenAI (deja configurate)
```
OPENAI_API_KEY=your_openai_api_key
ASSISTANT_ID=your_assistant_id
```

#### JWT Secret (IMPORTANT - generează unul nou!)
```bash
# Generează un secret random:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Apoi adaugă în Vercel:
```
JWT_SECRET=<secret_generat_mai_sus>
```

#### Stripe Configuration

1. Mergi pe [dashboard.stripe.com](https://dashboard.stripe.com)
2. Du-te la **Developers** → **API Keys**
3. Copiază **Secret key** și **Publishable key**:
   ```
   STRIPE_SECRET_KEY=sk_live_... (sau sk_test_... pentru testare)
   STRIPE_PUBLISHABLE_KEY=pk_live_... (sau pk_test_...)
   ```

4. **Creează un Price ID pentru abonament:**
   - Du-te la **Products** → **Add Product**
   - Nume: "Socrate AI - Abonament Lunar"
   - Preț: **29 RON** / lună
   - Tip: **Recurring** (monthly)
   - După creare, copiază **Price ID** (începe cu `price_...`)
   ```
   STRIPE_PRICE_ID=price_...
   ```

5. **Configurează Webhook pentru Stripe:**
   - Du-te la **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://socrate-ai.vercel.app/api/stripe/webhook`
   - Selectează evenimentele:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
   - După creare, copiază **Webhook signing secret**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### Mailerlite Configuration

1. Mergi pe [app.mailerlite.com](https://app.mailerlite.com)
2. Du-te la **Integrations** → **API**
3. Generează un **API Key**:
   ```
   MAILERLITE_API_KEY=your_mailerlite_api_key
   ```
4. (Opțional) Dacă vrei să adaugi userii într-un grup specific:
   - Creează un grup (ex: "Socrate AI Users")
   - Copiază **Group ID**:
   ```
   MAILERLITE_GROUP_ID=your_group_id
   ```

#### App URL
```
APP_URL=https://socrate-ai.vercel.app
```

### 3. Deploy pe Vercel

```bash
# Commit toate modificările
git add .
git commit -m "Add authentication, subscriptions, and anti-abuse protection"

# Push pe GitHub
git push origin main
```

Vercel va detecta automat push-ul și va face deploy.

### 4. Inițializare Bază de Date

**IMPORTANT:** După primul deploy, rulează o singură dată pentru a crea tabelele:

```bash
# Folosește curl sau Postman
curl -X POST https://socrate-ai.vercel.app/api/init-db
```

Răspuns așteptat:
```json
{
  "success": true,
  "message": "Database initialized successfully! Tables created.",
  "tables": ["users", "ip_tracking", "sessions", "usage_logs"]
}
```

**Notă de securitate:** După rulare, poți șterge fișierul `/api/init-db.js` sau adaugă protecție cu token în `.env`:
```
DB_INIT_SECRET=your_secret_token
```

### 5. Testare Completă

#### Test 1: Înregistrare
1. Mergi pe `https://socrate-ai.vercel.app`
2. Ar trebui să te redirectioneze la `/auth.html`
3. Înregistrează-te cu un email de test
4. Verifică că primești mesajul de bun venit

#### Test 2: Free Tier
1. Trimite 20 de mesaje
2. La mesajul 21, ar trebui să primești eroare cu buton "Upgrade"

#### Test 3: Upgrade la Paid (Stripe Test Mode)
1. Click pe "Upgrade"
2. Folosește card de test Stripe: `4242 4242 4242 4242`
3. Orice dată viitoare, orice CVC
4. Completează formularul
5. Verifică că ești redirecționat înapoi cu mesaj de succes

#### Test 4: Anti-abuse IP
1. Logout
2. Încearcă să creezi alt cont de pe același IP
3. Ar trebui să primești eroare: "Acest IP are deja un cont activ"

---

## Monitorizare & Maintenance

### Verificare Useri
```sql
-- Conectează-te la Vercel Postgres din dashboard
SELECT email, subscription_type, messages_used, messages_limit, created_at
FROM users
ORDER BY created_at DESC;
```

### Verificare Plăți
- Dashboard Stripe: [dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- Verifică `subscriptions` pentru abonamente active

### Logs & Debugging
- Vercel Dashboard → **Logs** pentru erori backend
- Browser Console pentru erori frontend

### Reset Lunar (Automatic)
Am implementat funcția `resetMonthlyUsage()` în `lib/db.js`. Pentru a o automatiza:
1. Crează un Vercel Cron Job:
   - File: `/api/cron/reset-usage.js`
   ```javascript
   import { resetMonthlyUsage } from '../../lib/db.js';

   export default async function handler(req, res) {
     if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
       return res.status(401).json({ error: 'Unauthorized' });
     }

     const result = await resetMonthlyUsage();
     return res.json({ success: true, resetCount: result.length });
   }
   ```

2. Adaugă în `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/reset-usage",
       "schedule": "0 0 1 * *"
     }]
   }
   ```

---

## Costuri Estimate (Lunar)

### Infrastructură
- **Vercel**: Free (până la 100GB bandwidth)
- **Vercel Postgres**: Free (256MB)
- **Stripe**: 2.9% + 1.2 RON per tranzacție

### API Costs (pentru 100 useri)
- **Free tier useri** (100 × 20 mesaje × $0.015): ~$30 (140 RON)
- **Paid tier useri** (estimat 10 useri × 300 mesaje × $0.015): ~$45 (210 RON)
- **Total API cost**: ~$75/lună (350 RON)

### Revenue (dacă 10 useri plătesc)
- 10 × 29 RON = **290 RON/lună**
- Minus Stripe fees (10 × 2.04 RON) = **20 RON**
- **Net revenue**: 270 RON/lună

**Concluzie**: La 10 paid users, aproape acoperi costurile. La 15-20+ paid users, devii profitabil! 🚀

---

## Troubleshooting

### Eroare: "Database initialization error"
- Verifică că toate variabilele `POSTGRES_*` sunt setate în Vercel
- Rulează din nou `/api/init-db`

### Eroare: "Stripe webhook failed"
- Verifică că `STRIPE_WEBHOOK_SECRET` este corect
- Testează webhook-ul în Stripe Dashboard → Webhooks → Send test webhook

### Userii nu primesc email în Mailerlite
- Verifică `MAILERLITE_API_KEY` în Vercel
- Errors în Mailerlite sunt "non-blocking" - app-ul va funcționa oricum

### IP anti-abuse nu funcționează
- Vercel folosește `x-forwarded-for` header
- Testează cu browsere diferite / incognito mode

---

## Next Steps (Opțional)

1. **Custom Domain**: Adaugă domeniu propriu în Vercel
2. **Analytics**: Integrează Google Analytics sau Plausible
3. **Email Verification**: Adaugă verificare email la înregistrare
4. **Password Reset**: Implementează reset parolă prin email
5. **Admin Dashboard**: Creează panou admin pentru management useri

---

## Support

Pentru întrebări sau probleme:
- GitHub Issues: [Repository Issues](https://github.com/danutmitrut/socrate-ai/issues)
- Email: [Email de contact]

**Succes cu Socrate AI! 🎓✨**
