# Security Documentation - SOCRATE-AI

**Data:** 13 noiembrie 2025
**Status:** Debug endpoints protejate cu autentificare

---

## 🔒 Protected Debug Endpoints

Toate endpoint-urile de debug sunt acum protejate și necesită autentificare pentru a preveni accesul neautorizat.

### Environment Variables Necesare

#### 1. DEBUG_SECRET
Folosit pentru protejarea endpoint-urilor de debug care manipulează date utilizatorilor.

**Setare în Vercel:**
1. Du-te la Vercel Dashboard → Proiectul tău → Settings → Environment Variables
2. Adaugă variabila:
   - **Name:** `DEBUG_SECRET`
   - **Value:** Un string aleator complex (ex: `my-super-secret-key-12345`)
   - **Environment:** Production, Preview, Development (toate)
3. Redeploy aplicația

#### 2. DB_INIT_SECRET
Folosit pentru protejarea endpoint-ului de inițializare database.

**Setare în Vercel:**
1. Adaugă variabila:
   - **Name:** `DB_INIT_SECRET`
   - **Value:** Un alt string aleator complex
   - **Environment:** Production, Preview, Development

---

## 📋 Protected Endpoints

### 1. `/api/debug/reset-database.js` - FOARTE PERICULOS! ⚠️
**Funcție:** Șterge și recrează toate tabelele din database (pierzi toate datele!)

**Folosire:**
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/reset-database \
  -H "Content-Type: application/json" \
  -H "x-debug-secret: your-debug-secret-here"
```

SAU cu body:
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/reset-database \
  -H "Content-Type: application/json" \
  -d '{"debugSecret": "your-debug-secret-here"}'
```

---

### 2. `/api/debug/manual-upgrade.js`
**Funcție:** Upgrade manual al unui user la paid subscription

**Folosire:**
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/manual-upgrade \
  -H "Content-Type: application/json" \
  -H "x-debug-secret: your-debug-secret-here" \
  -d '{"email": "user@example.com"}'
```

SAU:
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/manual-upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "debugSecret": "your-debug-secret-here"
  }'
```

---

### 3. `/api/debug/list-users.js`
**Funcție:** Listează toți userii din database (fără parole)

**Folosire:**
```bash
curl -X GET "https://socrate-ai-8teu.vercel.app/api/debug/list-users?debugSecret=your-debug-secret-here"
```

SAU cu header:
```bash
curl -X GET https://socrate-ai-8teu.vercel.app/api/debug/list-users \
  -H "x-debug-secret: your-debug-secret-here"
```

---

### 4. `/api/debug/reset-password.js`
**Funcție:** Resetează parola unui user (pentru testing)

**Folosire:**
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/reset-password \
  -H "Content-Type: application/json" \
  -H "x-debug-secret: your-debug-secret-here" \
  -d '{
    "email": "user@example.com",
    "newPassword": "newpass123"
  }'
```

SAU:
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/debug/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "newPassword": "newpass123",
    "debugSecret": "your-debug-secret-here"
  }'
```

---

### 5. `/api/init-db.js`
**Funcție:** Inițializează database-ul (creează tabele la prima rulare)

**Folosire:**
```bash
curl -X POST https://socrate-ai-8teu.vercel.app/api/init-db \
  -H "Content-Type: application/json" \
  -H "x-init-token: your-db-init-secret-here"
```

---

## 🚨 Error Responses

### Dacă DEBUG_SECRET nu e configurat:
```json
{
  "error": "DEBUG_SECRET not configured",
  "message": "Set DEBUG_SECRET in Vercel environment variables to use this endpoint"
}
```
**Status Code:** 403 Forbidden

### Dacă DEBUG_SECRET e incorect:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing DEBUG_SECRET. Send via x-debug-secret header or debugSecret in body."
}
```
**Status Code:** 401 Unauthorized

---

## 🎯 Best Practices

### Pentru Development/Testing:
1. Setează `DEBUG_SECRET` cu o valoare simplă pentru testare (ex: `test123`)
2. Folosește endpoint-urile liber pentru debugging
3. **NU UITA** să schimbi secret-ul înainte de producție!

### Pentru Production:
1. Generează un `DEBUG_SECRET` aleator și complex:
   ```bash
   # Exemplu cu openssl:
   openssl rand -base64 32
   ```
2. Salvează secret-ul într-un loc sigur (password manager)
3. Setează-l în Vercel doar pentru environment-ul Production
4. **OPȚIONAL:** Șterge complet folder-ul `/api/debug/` după ce nu mai ai nevoie de el

### Generare Secret Securizat:
```bash
# Opțiune 1: OpenSSL
openssl rand -base64 32

# Opțiune 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opțiune 3: Online
# https://www.random.org/strings/
```

---

## ⚠️ Avertismente Importante

1. **NU împărtăși NICIODATĂ** valorile SECRET în git, email, sau chat
2. **NU lăsa** aceste endpoint-uri neprotejate în producție
3. **reset-database.js** șterge TOATE datele - folosește cu extremă grijă!
4. După ce aplicația e stabilă în producție, **șterge complet** folder-ul `/api/debug/`

---

## 📝 Checklist Pre-Production

Înainte de a trece la Live Mode:

- [ ] DEBUG_SECRET setat în Vercel cu valoare complexă (32+ caractere)
- [ ] DB_INIT_SECRET setat în Vercel cu valoare complexă
- [ ] Testat că endpoint-urile refuză access fără secret
- [ ] Secret-urile salvate în password manager
- [ ] **Considerat ștergerea completă a** `/api/debug/` **folder-ului**
- [ ] Documentat cum să accesezi endpoint-urile în caz de urgență

---

## 🔗 Resurse Utile

- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Security Best Practices:** https://vercel.com/docs/security/deployment-protection
- **Generate Random Strings:** https://www.random.org/strings/

---

**✅ Endpoint-urile tale sunt acum protejate și sigure pentru folosire în producție!**
