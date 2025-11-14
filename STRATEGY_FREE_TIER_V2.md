# Strategy: Free Tier V2 - Model B+ (Dormant Accounts)

**Data:** 14 noiembrie 2025
**Status:** 📝 PLANIFICAT (pentru implementare)

---

## 🎯 OBIECTIVE

### Model Actual (ce vrem să schimbăm):
- ❌ Free tier: 20 mesaje SAU 72h (ambele verificate)
- ❌ Cont expirat → blocat, dar nu e clar ce se întâmplă
- ❌ Lipsește handling pentru paid → free downgrade
- ❌ Nu avem email notifications

### Model Nou (B+ Dormant):
- ✅ Free tier: 20 mesaje ȘI 72h (scarecity mechanism)
- ✅ Când free expiră → cont "dormant" (read-only access la istoric)
- ✅ IP tracking cu warning messages (soft enforcement la început)
- ✅ Paid downgrade → revine la dormant (nu la free activ)
- ✅ Email notifications pentru evenimente cheie

---

## 📊 FLOW-URI UTILIZATOR

### Flow 1: Free User → Dormant
```
1. Register → 20 mesaje, 72h
2. Folosește 20 mesaje SAU trec 72h
3. Cont → "dormant"
   - Poate vedea istoricul conversațiilor
   - NU poate trimite mesaje noi
   - Mesaj: "Ai folosit cele 20 mesaje gratuite. Upgrade pentru a continua!"
4. Buton "Upgrade la Paid" (galben, prominent)
```

### Flow 2: Paid User (Active)
```
1. Plătește 29 RON/lună
2. Primește 300 mesaje/lună
3. Mesaje se resetează la 1 a fiecărei luni
4. Dacă termină 300 mesaje înainte de lună → mesaj:
   "Ai folosit toate cele 300 de mesaje. Se resetează pe [DATA]"
   SAU opțional: "Cumpără 100 mesaje extra (10 RON)"
```

### Flow 3: Paid User → Cancel → Downgrade
```
1. User anulează subscription
2. Păstrează acces Paid până la sfârșitul perioadei
3. Pe data expirării:
   - Webhook: customer.subscription.deleted
   - User revine la "dormant" (NU free activ!)
   - Mesaj: "Abonamentul a expirat. Reînnoiește pentru acces complet!"
```

### Flow 4: Re-registration (IP Tracking)
```
1. User încearcă să creeze cont nou cu același IP
2. Check în ip_tracking table
3. Dacă IP există:
   - Mesaj warning: "Se pare că ai mai folosit perioada gratuită de pe acest dispozitiv"
   - Permitem register, dar:
     - Cont creat direct ca "dormant" (0 mesaje)
     - Trebuie upgrade imediat
```

---

## 🗄️ DATABASE CHANGES

### 1. Add `account_status` column
```sql
ALTER TABLE users
ADD COLUMN account_status VARCHAR(20) DEFAULT 'active'
CHECK (account_status IN ('active', 'dormant'));
```

### 2. Migration Script
Fișier: `/api/debug/add-account-status-column.js`

---

## 🔧 CODE CHANGES

### 1. lib/db.js

**Add helper functions:**
```javascript
// Set account to dormant
export async function setAccountDormant(userId) {
  const result = await sql`
    UPDATE users
    SET account_status = 'dormant'
    WHERE id = ${userId}
    RETURNING *
  `;
  return result.rows[0];
}

// Reactivate account (when user upgrades)
export async function setAccountActive(userId) {
  const result = await sql`
    UPDATE users
    SET account_status = 'active'
    WHERE id = ${userId}
    RETURNING *
  `;
  return result.rows[0];
}
```

**Update `checkUserLimit()`:**
```javascript
export async function checkUserLimit(userId) {
  const user = await getUserById(userId);

  if (!user) return { allowed: false, reason: 'User not found' };

  // Check if account is dormant
  if (user.account_status === 'dormant') {
    return {
      allowed: false,
      reason: 'Account dormant - upgrade required',
      user,
      requiresUpgrade: true
    };
  }

  // ... rest of existing checks
}
```

### 2. api/stripe/webhook.js

**Update `customer.subscription.deleted`:**
```javascript
case 'customer.subscription.deleted': {
  const subscription = event.data.object;
  const userId = parseInt(subscription.metadata.userId);

  // Downgrade user to dormant (NOT active free)
  await sql`
    UPDATE users
    SET
      subscription_type = 'free',
      account_status = 'dormant',
      messages_limit = 0,
      messages_used = 0,
      stripe_subscription_id = NULL,
      subscription_ends_at = NULL,
      subscription_cancel_at = NULL
    WHERE id = ${userId}
  `;

  // Record event
  await recordStripeEvent(event.id, event.type, userId, {
    subscription_id: subscription.id
  });

  console.log(`Subscription ended - user ${userId} set to dormant`);
  break;
}
```

**Update `checkout.session.completed` & `invoice.payment_succeeded`:**
```javascript
// After successful payment, reactivate account
await sql`
  UPDATE users
  SET account_status = 'active'
  WHERE id = ${userId}
`;
```

### 3. api/auth/register.js

**Add IP tracking check:**
```javascript
// Check if IP already used free trial
const ipExists = await sql`
  SELECT COUNT(*) as count FROM ip_tracking
  WHERE ip_address = ${ipAddress}
`;

const hasUsedFreeTrial = ipExists.rows[0].count > 0;

// Create user
const accountStatus = hasUsedFreeTrial ? 'dormant' : 'active';
const messagesLimit = hasUsedFreeTrial ? 0 : 20;

const result = await sql`
  INSERT INTO users (
    email,
    password_hash,
    account_status,
    messages_limit
  )
  VALUES (${email}, ${passwordHash}, ${accountStatus}, ${messagesLimit})
  RETURNING *
`;

// Return warning if IP already used
return res.status(201).json({
  success: true,
  user: { id: user.id, email: user.email },
  warning: hasUsedFreeTrial ?
    'Se pare că ai mai folosit perioada gratuită. Upgrade pentru acces complet!' :
    null
});
```

### 4. api/chat.js

**Block dormant users:**
```javascript
const limitCheck = await checkUserLimit(decoded.userId);

if (!limitCheck.allowed) {
  if (limitCheck.requiresUpgrade) {
    return res.status(403).json({
      error: 'Account dormant',
      message: 'Ai folosit cele 20 mesaje gratuite. Upgrade pentru a continua!',
      upgradeRequired: true
    });
  }

  // Other limit errors...
}
```

### 5. app.js (Frontend)

**Handle dormant status:**
```javascript
// In checkAuth() or when sending message
if (error.upgradeRequired) {
  // Show upgrade modal
  alert('Ai folosit cele 20 mesaje gratuite. Upgrade pentru a continua!');
  // Redirect to upgrade or show upgrade button
}
```

**Update user info display:**
```javascript
${user.account_status === 'dormant' ? `
  <div style="color: #fca5a5; font-size: 0.9rem; margin-bottom: 1rem;">
    ⚠️ Cont dormant - Upgrade pentru acces complet!
  </div>
` : ''}
```

---

## 📧 EMAIL NOTIFICATIONS (FAZA 2)

### Evenimente:
1. **Welcome Email** (la register)
   - Subject: "Bun venit la Socrate AI! 🎉"
   - Body: Explicare free tier, cum funcționează

2. **Payment Success** (la upgrade)
   - Subject: "Plata confirmată - Abonament activ! ✅"
   - Body: Confirmare plată, detalii subscription

3. **Free Trial Expired** (când devine dormant)
   - Subject: "Perioada gratuită s-a încheiat"
   - Body: Invitație upgrade, beneficii paid

4. **Subscription Canceled** (la cancel)
   - Subject: "Abonament anulat - Activ până pe [DATA]"
   - Body: Confirmare anulare, data expirării

5. **Subscription Expired** (când paid → dormant)
   - Subject: "Abonamentul a expirat"
   - Body: Invitație reînnoire

6. **Password Reset** (recovery)
   - Subject: "Resetare parolă Socrate AI"
   - Body: Link resetare (expires în 1h)

### Email Service Options:
- **Mailersend** (3000 emails/lună gratuit) ✅ RECOMANDAT
- **Resend** (3000 emails/lună gratuit)
- **SendGrid** (100 emails/zi gratuit)

---

## 💰 ADD-ON MESAJE (FAZA 3 - Opțional)

### Produs Stripe:
- **Nume:** "100 Mesaje Extra"
- **Preț:** 10 RON (one-time payment)
- **Validitate:** Se adaugă la limita curentă
- **Expirare:** Până la sfârșitul lunii curente

### Calcul Preț:
- Plan Paid: 29 RON / 300 mesaje = **0.097 RON/mesaj**
- Add-on: 10 RON / 100 mesaje = **0.10 RON/mesaj** (similar)

### Implementare:
```javascript
// Endpoint: /api/stripe/buy-addon-messages
// Creates one-time payment for 100 messages
// On success webhook → increment messages_limit by 100
```

---

## 🧹 CURĂȚENIE DATABASE (Conturi Inactive)

### Strategie:
**Opțiune A: Soft Delete (Recomandat)**
```sql
-- Marchează conturi dormant > 6 luni ca "archived"
UPDATE users
SET account_status = 'archived'
WHERE account_status = 'dormant'
  AND last_reset_at < NOW() - INTERVAL '6 months';

-- Optional: Delete archived > 1 an
DELETE FROM users
WHERE account_status = 'archived'
  AND last_reset_at < NOW() - INTERVAL '1 year';
```

**Opțiune B: Email Reactivation**
- La 3 luni dormant → email "Îți lipsește Socrate?"
- La 6 luni dormant → ultimul email "Contul va fi șters în 30 zile"
- La 7 luni dormant → delete account

---

## ✅ CHECKLIST IMPLEMENTARE

### FAZA 1 (Acum):
- [ ] Add `account_status` column în users table
- [ ] Migration script pentru existing users
- [ ] Update `checkUserLimit()` în lib/db.js
- [ ] Fix webhook `customer.subscription.deleted`
- [ ] Add dormant check în api/chat.js
- [ ] Update UI pentru dormant status
- [ ] IP tracking la register
- [ ] Testing all flows

### FAZA 2 (Următoare sesiune):
- [ ] Setup email service (Mailersend)
- [ ] Email templates (welcome, payment, etc.)
- [ ] Email endpoints
- [ ] Password recovery feature

### FAZA 3 (Opțional):
- [ ] Stripe product pentru add-on mesaje
- [ ] Endpoint buy-addon-messages
- [ ] Webhook handling pentru add-on
- [ ] UI pentru buy more messages

---

## 🎯 NEXT STEPS

**Azi (Sesiunea curentă):**
1. Review acest document
2. Decide: Implementăm FAZA 1 acum sau în următoarea sesiune?
3. Dacă da → creăm migration + modificări cod

**Următoarea sesiune:**
- FAZA 2: Email notifications + Password recovery

---

**Status:** ⏳ WAITING FOR APPROVAL

Implementăm FAZA 1 acum? 🚀
