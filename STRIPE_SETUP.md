# 🔧 Setup Stripe + Vercel - Ghid Pas-cu-Pas

**Timp estimat:** 15-20 minute
**Status:** Cod gata ✅ | Environment variables LIPSĂ ⚠️

---

## 📋 Ce trebuie să faci (Checklist)

- [ ] **Pas 1:** Obține 3 keys din Stripe Dashboard
- [ ] **Pas 2:** Creează un Price ID pentru abonament (29 RON/lună)
- [ ] **Pas 3:** Configurează Environment Variables în Vercel
- [ ] **Pas 4:** Configurează Stripe Webhook
- [ ] **Pas 5:** Testează integrarea

---

## 🔑 Pas 1: Obține Stripe API Keys (5 min)

### 1.1 Deschide Stripe Dashboard
1. Mergi la: **https://dashboard.stripe.com/apikeys**
2. Loghează-te sau creează cont nou (dacă nu ai)

### 1.2 Obține API Keys
În secțiunea **API Keys**, vei vedea:

#### **Secret Key** (sk_test_... sau sk_live_...)
```
sk_test_51QaD... (pentru testare - ÎNCEPE CU ACESTA!)
sk_live_51QaD... (pentru producție - folosește după ce testezi)
```

**📋 Copiază și salvează:**
```
STRIPE_SECRET_KEY=sk_test_...
```

#### **Publishable Key** (pk_test_... sau pk_live_...)
```
pk_test_51QaD... (pentru testare)
pk_live_51QaD... (pentru producție)
```

**📋 Copiază și salvează:**
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

⚠️ **Important:**
- Începe cu `sk_test_` și `pk_test_` pentru testare
- După ce testezi, switch la `sk_live_` și `pk_live_` pentru producție
- **NU** commita aceste keys în Git! (sunt deja în .gitignore)

---

## 💰 Pas 2: Creează Price ID pentru Abonament (5 min)

### 2.1 Creează un Produs
1. Mergi la: **https://dashboard.stripe.com/products**
2. Click **+ Add product**
3. Completează:
   - **Name:** `Socrate AI - Abonament Lunar`
   - **Description:** `Acces complet: 300 mesaje/lună`

### 2.2 Configurează Prețul
4. În secțiunea **Pricing:**
   - **Price:** `29` RON
   - **Billing period:** `Monthly` (Lunar)
   - Click **Add pricing**

### 2.3 Salvează și Copiază Price ID
5. Click **Save product**
6. După salvare, vei vedea un **Price ID** care începe cu `price_...`

**📋 Copiază și salvează:**
```
STRIPE_PRICE_ID=price_1QaD...
```

**Screenshot exemplu:**
```
Product: Socrate AI - Abonament Lunar
Price ID: price_1QaDxxx... ← COPIAZĂ ACESTA
Amount: 29.00 RON / month
```

---

## 🌐 Pas 3: Configurează Environment Variables în Vercel (5 min)

### 3.1 Deschide Vercel Dashboard
1. Mergi la: **https://vercel.com/dashboard**
2. Selectează proiectul **socrate-ai**

### 3.2 Du-te la Settings → Environment Variables
3. Click **Settings** (în meniul lateral)
4. Click **Environment Variables**

### 3.3 Adaugă Stripe Variables
Click **Add New** pentru fiecare variabilă:

#### Variabila 1: STRIPE_SECRET_KEY
```
Name: STRIPE_SECRET_KEY
Value: sk_test_51QaD... (paste din Pas 1)
Environment: Production, Preview, Development (selectează toate)
```

#### Variabila 2: STRIPE_PUBLISHABLE_KEY
```
Name: STRIPE_PUBLISHABLE_KEY
Value: pk_test_51QaD... (paste din Pas 1)
Environment: Production, Preview, Development
```

#### Variabila 3: STRIPE_PRICE_ID
```
Name: STRIPE_PRICE_ID
Value: price_1QaD... (paste din Pas 2)
Environment: Production, Preview, Development
```

#### Variabila 4: STRIPE_WEBHOOK_SECRET
```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_... (vom completa în Pas 4 - LASĂ GOL DEOCAMDATĂ)
Environment: Production, Preview, Development
```

### 3.4 Verifică Celelalte Variables (ar trebui să existe deja)

Verifică că ai și acestea configurate:
```
✅ OPENAI_API_KEY
✅ ASSISTANT_ID
✅ JWT_SECRET
✅ APP_URL (ex: https://socrate-ai.vercel.app)
✅ POSTGRES_URL (și toate celelalte POSTGRES_*)
```

**Lipsește JWT_SECRET?** Generează unul:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🪝 Pas 4: Configurează Stripe Webhook (10 min)

**⚠️ IMPORTANT:** Webhook-ul TREBUIE configurat DUPĂ ce faci deploy pe Vercel!

### 4.1 Deploy pe Vercel (dacă nu ai făcut deja)
```bash
git add .
git commit -m "Add Stripe configuration and setup guide"
git push origin main
```

Vercel va face deploy automat. Așteaptă până când deployment este **Ready**.

### 4.2 Notează URL-ul Vercel
După deploy, URL-ul tău va fi ceva de genul:
```
https://socrate-ai.vercel.app
```

### 4.3 Creează Webhook în Stripe
1. Mergi la: **https://dashboard.stripe.com/webhooks**
2. Click **+ Add endpoint**

### 4.4 Configurează Webhook-ul
3. În câmpul **Endpoint URL**, adaugă:
   ```
   https://socrate-ai.vercel.app/api/stripe/webhook
   ```
   (Înlocuiește `socrate-ai.vercel.app` cu URL-ul tău real)

4. Click **Select events**

### 4.5 Selectează Evenimentele
5. Caută și bifează următoarele evenimente:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `customer.subscription.deleted`

6. Click **Add events**

7. Click **Add endpoint**

### 4.6 Obține Webhook Secret
8. După creare, vei vedea secțiunea **Signing secret**
9. Click **Reveal** pentru a vedea secretul
10. Copiază valoarea (începe cu `whsec_...`)

**📋 Copiază și salvează:**
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4.7 Adaugă Webhook Secret în Vercel
11. Înapoi în **Vercel Dashboard** → **Settings** → **Environment Variables**
12. Găsește `STRIPE_WEBHOOK_SECRET` (ai creat-o goală în Pas 3.3)
13. Click **Edit**
14. Paste valoarea `whsec_...`
15. **Save**

### 4.8 Redeploy pentru a aplica modificările
16. În Vercel Dashboard, du-te la **Deployments**
17. Click **...** pe ultimul deployment
18. Click **Redeploy**
19. Confirmă redeploy

---

## ✅ Pas 5: Testează Integrarea (5 min)

### 5.1 Testează Webhook în Stripe Dashboard
1. Înapoi în **Stripe Dashboard** → **Webhooks**
2. Click pe webhook-ul tău (`/api/stripe/webhook`)
3. Click **Send test webhook**
4. Selectează `checkout.session.completed`
5. Click **Send test webhook**

**Rezultat așteptat:**
```
✅ Response: 200 OK
✅ Webhook delivered successfully
```

### 5.2 Testează Plata (Test Mode)
1. Deschide aplicația ta: `https://socrate-ai.vercel.app`
2. Înregistrează-te cu un email de test
3. Click pe **Upgrade la Paid**
4. În formularul Stripe, folosește card de test:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34 (orice dată viitoare)
   CVC: 123 (orice 3 cifre)
   ZIP: 12345
   ```
5. Completează și trimite

**Rezultat așteptat:**
```
✅ Redirected înapoi la app
✅ Mesaj: "Plata a fost procesată cu succes!"
✅ În Stripe Dashboard → Payments: vezi plata de 29 RON
```

### 5.3 Verifică în Stripe Dashboard
1. Mergi la: **https://dashboard.stripe.com/payments**
2. Ar trebui să vezi plata de test
3. Du-te la: **https://dashboard.stripe.com/subscriptions**
4. Ar trebui să vezi abonamentul activ

---

## 🎉 Setup Complet!

Dacă toate testele au trecut, **setup-ul Stripe este COMPLET**! 🚀

### Checklist Final:
- ✅ Stripe API keys configurate în Vercel
- ✅ Price ID pentru abonament de 29 RON/lună
- ✅ Webhook configurat și funcțional
- ✅ Test plată executat cu succes
- ✅ Aplicația primește notificări de la Stripe

---

## 🔄 Switch de la Test Mode la Live Mode (când ești gata)

### Când să faci switch:
- După ce ai testat complet aplicația
- Când vrei să primești plăți reale
- **NICIODATĂ** nu face switch înainte să testezi!

### Pașii:
1. În **Stripe Dashboard**, switch la **Live mode** (toggle în dreapta sus)
2. Obține keys noi:
   - `sk_live_...` (Secret Key)
   - `pk_live_...` (Publishable Key)
3. Creează un webhook NOU pentru Live mode (cu aceleași evenimente)
4. Obține `whsec_...` pentru Live webhook
5. În **Vercel**, actualizează toate 3 variabilele:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (Live)
   ```
6. Redeploy

⚠️ **Important:** Price ID (`price_...`) rămâne același dacă l-ai creat în Live mode inițial.

---

## 🐛 Troubleshooting

### Eroare: "No such price"
**Cauză:** `STRIPE_PRICE_ID` este greșit sau nu există
**Soluție:**
1. Verifică că ai copiat Price ID corect din Stripe Dashboard
2. Verifică că Price ID este pentru modul corect (Test sau Live)

### Eroare: "Invalid API Key"
**Cauză:** `STRIPE_SECRET_KEY` este greșit sau expirat
**Soluție:**
1. Verifică că ai copiat corect din Stripe Dashboard
2. Verifică că folosești cheia pentru modul corect (Test: `sk_test_` / Live: `sk_live_`)

### Webhook nu primește evenimente
**Cauză:** URL greșit sau Webhook Secret incorect
**Soluție:**
1. Verifică că URL-ul webhook este exact: `https://TĂU_URL.vercel.app/api/stripe/webhook`
2. Verifică că `STRIPE_WEBHOOK_SECRET` în Vercel match-uiește cu cel din Stripe Dashboard
3. Testează cu "Send test webhook" în Stripe Dashboard

### Plata trece dar user-ul nu este upgrade-at
**Cauză:** Webhook nu funcționează sau database error
**Soluție:**
1. Verifică logs în Vercel Dashboard → Logs
2. Verifică că toate variabilele `POSTGRES_*` sunt configurate
3. Testează webhook cu "Send test webhook"

---

## 📞 Ai nevoie de ajutor?

**Documentație oficială:**
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

**Verifică:**
- ✅ Toate environment variables în Vercel
- ✅ Webhook URL corect în Stripe
- ✅ Logs în Vercel Dashboard pentru erori

---

**🎓 Mult succes cu Socrate AI!**
