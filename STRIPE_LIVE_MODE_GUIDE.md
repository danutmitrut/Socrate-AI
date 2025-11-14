# Stripe Live Mode - Ghid Complet Activare

**Data:** 14 noiembrie 2025
**Status:** 🚀 IN PROGRESS

---

## 📋 CHECKLIST COMPLET

- [ ] **Pas 1:** Verifică că contul Stripe este validat
- [ ] **Pas 2:** Activează Live Mode în Stripe Dashboard
- [ ] **Pas 3:** Creează produs Live (29 RON/lună)
- [ ] **Pas 4:** Obține Live API Keys
- [ ] **Pas 5:** Creează Live Webhook
- [ ] **Pas 6:** Actualizează Environment Variables în Vercel
- [ ] **Pas 7:** Test cu plată reală
- [ ] **Pas 8:** Verifică webhook Live

---

## 🔐 PAS 1: Verifică Contul Stripe

### Ce trebuie să verifici:

1. **Deschide Stripe Dashboard:**
   - URL: https://dashboard.stripe.com
   - Login cu contul tău

2. **Verifică că ești în Test Mode:**
   - În stânga sus ar trebui să vezi un switch "Test mode"
   - Ar trebui să fie ON (portocaliu)

3. **Verifică Account Validation:**
   - Click pe Settings (jos stânga) → Account details
   - Verifică dacă ai completat:
     - ✅ Business name
     - ✅ Business type
     - ✅ Country (Romania)
     - ✅ Email
     - ✅ Phone number

4. **Activare plăți în România:**
   - Settings → Payment methods
   - Verifică că sunt activate:
     - ✅ Card payments (Visa, Mastercard)
     - ✅ EUR ca valută

**⚠️ IMPORTANT:**
- Stripe ar putea cere verificare identitate înainte de Live Mode
- Ar putea dura 1-2 zile business pentru aprobare
- Asigură-te că ai acces la documentele necesare

---

## 🚀 PAS 2: Activează Live Mode

### Cum activezi Live Mode:

1. **În Stripe Dashboard:**
   - Click pe switch-ul "Test mode" (stânga sus)
   - Click "Activate your account"

2. **Completează informațiile cerute:**
   - Company details (nume firmă, CUI/CIF)
   - Bank account pentru payouts (IBAN)
   - Tax information
   - Identity verification (posibil carte de identitate)

3. **Așteaptă aprobare:**
   - Stripe va verifica informațiile
   - Vei primi email când este aprobat
   - Durată: instant până la 2 zile

**NOTĂ:** Dacă contul e deja activat, vei vedea switch-ul "Test mode" off (gri).

---

## 💰 PAS 3: Creează Produs Live

### Creează produsul de subscription:

1. **Navighează la Products:**
   - Asigură-te că ești în **Live Mode** (switch off)
   - Click pe "Products" în sidebar
   - Click "Add product"

2. **Configurează produsul:**
   ```
   Name: Socrate AI - Monthly Subscription
   Description: 300 mesaje/lună cu Socrate, asistentul tău AI

   Pricing:
   - Price: 29 RON
   - Billing period: Monthly (recurring)
   - Currency: RON

   Payment options:
   ✅ One-time payment
   ✅ Subscription
   ```

3. **Salvează produsul:**
   - Click "Save product"
   - **IMPORTANT:** Copiază **Price ID** (începe cu `price_...`)
   - Exemplu: `price_1ABCD1234567890EFGH`

**Notează aici Price ID:**
```
STRIPE_PRICE_ID (Live) = price_________________
```

---

## 🔑 PAS 4: Obține Live API Keys

### Unde găsești API keys:

1. **Navighează la API Keys:**
   - Click pe "Developers" în sidebar
   - Click pe "API keys"
   - **Asigură-te că Test mode este OFF!**

2. **Copiază keys-urile:**

**Publishable Key (pk_live_...):**
```
Click "Reveal live key token"
Copiază key-ul complet

STRIPE_PUBLISHABLE_KEY (Live) = pk_live_________________
```

**Secret Key (sk_live_...):**
```
Click "Reveal live key token" pentru Secret key
Copiază key-ul complet

⚠️ IMPORTANT: Nu împărtăși niciodată acest key!

STRIPE_SECRET_KEY (Live) = sk_live_________________
```

---

## 🔗 PAS 5: Creează Live Webhook

### Configurează webhook endpoint:

1. **Navighează la Webhooks:**
   - Developers → Webhooks
   - **Asigură-te că Test mode este OFF!**
   - Click "Add endpoint"

2. **Configurează endpoint-ul:**
   ```
   Endpoint URL: https://socrate-ai-8teu.vercel.app/api/stripe/webhook

   Description: Live webhook for subscription events

   Events to send:
   ✅ checkout.session.completed
   ✅ invoice.payment_succeeded
   ✅ customer.subscription.deleted
   ✅ customer.subscription.updated (optional)
   ```

3. **Salvează și obține Signing Secret:**
   - Click "Add endpoint"
   - Click pe webhook-ul nou creat
   - Scroll la "Signing secret"
   - Click "Reveal"
   - **Copiază secret-ul (începe cu `whsec_...`)**

**Notează aici Webhook Secret:**
```
STRIPE_WEBHOOK_SECRET (Live) = whsec_________________
```

---

## ⚙️ PAS 6: Actualizează Vercel Environment Variables

### Accesează Vercel Dashboard:

1. **Deschide:** https://vercel.com/dashboard
2. **Click pe:** "socrate-ai" project
3. **Settings → Environment Variables**

### Actualizează variabilele:

**Găsește și actualizează următoarele (click Edit):**

1. **STRIPE_SECRET_KEY**
   - Old value: `sk_test_...`
   - New value: `sk_live_...` (din Pas 4)

2. **STRIPE_PUBLISHABLE_KEY**
   - Old value: `pk_test_...`
   - New value: `pk_live_...` (din Pas 4)

3. **STRIPE_PRICE_ID**
   - Old value: `price_...` (test)
   - New value: `price_...` (Live - din Pas 3)

4. **STRIPE_WEBHOOK_SECRET**
   - Old value: `whsec_...` (test)
   - New value: `whsec_...` (Live - din Pas 5)

### Redeploy aplicația:

După ce salvezi toate variabilele:
- Vercel va cere automat redeploy
- SAU: Deployments → click pe ultimul deployment → "Redeploy"
- Așteaptă ~1 minut pentru deployment

---

## 💳 PAS 7: Test cu Plată Reală

### ⚠️ IMPORTANT ÎNAINTE DE TEST:

**Vei folosi CARDUL TĂU REAL și vei fi taxat 29 RON!**

Dacă vrei să eviți asta acum:
- Poți să testezi doar flow-ul până la checkout
- Poți anula subscripția imediat după test
- Stripe va returna banii în 5-10 zile

### Pregătire pentru test:

1. **Creează un cont NOU în aplicație:**
   - NU folosi `danmitrut@gmail.com` (deja are paid)
   - Folosește un email diferit (ex: `test@gmail.com`)
   - Sau folosește incognito mode

2. **Verifică că aplicația folosește Live keys:**
   ```bash
   # Check că deployment-ul s-a făcut
   curl https://socrate-ai-8teu.vercel.app/
   # Ar trebui să returneze 200 OK
   ```

### Flow-ul testului:

1. **Register cont nou:**
   - Deschide: https://socrate-ai-8teu.vercel.app/auth.html
   - Register cu email nou
   - Login

2. **Testează Free Tier:**
   - Trimite 1-2 mesaje în chat
   - Verifică că Socrate răspunde
   - Verifică că "Messages: 1/20" se incrementează

3. **Click pe "Upgrade to Paid":**
   - Ar trebui să te redirecteze la Stripe Checkout
   - **IMPORTANT:** Verifică URL-ul:
     - Ar trebui să fie `checkout.stripe.com`
     - NU ar trebui să conțină "test" în URL

4. **Completează plata:**
   ```
   Email: (email-ul tău real)
   Card: CARDUL TĂU REAL

   Test cards NU FUNCȚIONEAZĂ în Live Mode!
   Folosește:
   - Visa/Mastercard personal
   - Vei fi taxat 29 RON
   ```

5. **Finalizează plata:**
   - Click "Subscribe"
   - Așteaptă redirect la aplicație
   - Ar trebui să vezi: "Subscription: Paid"
   - Messages: "0/300"

---

## 🔍 PAS 8: Verifică Webhook Live

### Verifică în Stripe Dashboard:

1. **Deschide Webhooks:**
   - Developers → Webhooks
   - Click pe webhook-ul Live
   - Tab "Events"

2. **Ar trebui să vezi evenimente:**
   ```
   ✅ checkout.session.completed - Success (200)
   ✅ invoice.payment_succeeded - Success (200)
   ```

3. **Click pe fiecare event:**
   - Verifică că Response: `200 OK`
   - Verifică că Body: `{"received":true}`

### Verifică în Database (Neon):

1. **Deschide Neon Console:**
   - https://console.neon.tech
   - SQL Editor

2. **Verifică user-ul nou:**
   ```sql
   SELECT
     id,
     email,
     subscription_type,
     messages_used,
     messages_limit,
     subscription_ends_at
   FROM users
   WHERE subscription_type = 'paid'
   ORDER BY id DESC
   LIMIT 1;
   ```

   **Rezultat așteptat:**
   ```
   subscription_type: paid
   messages_limit: 300
   messages_used: 0
   subscription_ends_at: (data peste ~30 zile)
   ```

3. **Verifică stripe_events:**
   ```sql
   SELECT
     id,
     stripe_event_id,
     event_type,
     processed_at,
     user_id
   FROM stripe_events
   ORDER BY id DESC
   LIMIT 5;
   ```

   **Ar trebui să vezi:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`

---

## ✅ SUCCESS CHECKLIST

După ce finalizezi testul, verifică:

- [ ] ✅ Stripe is in Live Mode
- [ ] ✅ Live product created (29 RON/month)
- [ ] ✅ Live API keys obtained
- [ ] ✅ Live webhook configured
- [ ] ✅ Vercel environment variables updated
- [ ] ✅ Application redeployed
- [ ] ✅ Real payment processed successfully
- [ ] ✅ Webhook events received (200 OK)
- [ ] ✅ User upgraded to paid in database
- [ ] ✅ stripe_events table populated

---

## 🎯 DUPĂ TEST - Opțional

### Anulează subscripția test (dacă vrei):

1. **În Stripe Dashboard (Live Mode):**
   - Customers → Click pe customer-ul tău
   - Tab "Subscriptions"
   - Click pe subscription
   - Click "Cancel subscription"
   - Selectează "Cancel immediately"

2. **Verifică refund:**
   - Stripe ar trebui să proceseze refund automat
   - Banii vor fi returnați în 5-10 zile

**SAU păstrează subscripția activă pentru testing continuu!**

---

## 🚨 TROUBLESHOOTING

### Problema: "Your account is not activated"
**Soluție:** Completează activarea contului în Stripe (Pas 1-2)

### Problema: Webhook returnează eroare
**Soluție:**
- Verifică că `STRIPE_WEBHOOK_SECRET` este cel Live (nu test)
- Verifică în Vercel că deployment-ul s-a făcut
- Test webhook manual din Stripe Dashboard

### Problema: Plata merge, dar user nu se upgradeaza
**Soluție:**
- Verifică webhook events în Stripe
- Verifică logs în Vercel (Vercel Dashboard → Logs)
- Caută erori în procesarea webhook-ului

### Problema: Card declined
**Soluție:**
- Verifică că folosești card REAL (nu test card)
- Verifică sold disponibil
- Contactează banca pentru verificare 3D Secure

---

## 📞 RESURSE

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Database:** https://console.neon.tech
- **App Live:** https://socrate-ai-8teu.vercel.app

- **Stripe Docs - Going Live:** https://stripe.com/docs/development/quickstart#going-live
- **Stripe Support:** https://support.stripe.com

---

**🚀 SUCCES! Aplicația ta este acum LIVE și poate accepta plăți reale! 💰**
