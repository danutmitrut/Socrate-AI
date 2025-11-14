# Setup Secrets în Vercel - Quick Guide

**IMPORTANT:** Trebuie să setezi aceste secrets ACUM pentru ca debug endpoints să funcționeze!

## 🔐 Pași Rapidi

### 1. Generează Secrets

Rulează aceste comenzi pentru a genera secrets aleatorii:

```bash
# Pentru DEBUG_SECRET
node -e "console.log('DEBUG_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Pentru DB_INIT_SECRET
node -e "console.log('DB_INIT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

**SAU** folosește OpenSSL:
```bash
openssl rand -base64 32
```

### 2. Adaugă în Vercel

1. **Du-te la:** https://vercel.com/dashboard
2. **Click pe:** Proiectul tău (socrate-ai-8teu)
3. **Settings** → **Environment Variables**
4. **Adaugă prima variabilă:**
   - Name: `DEBUG_SECRET`
   - Value: [paste secret generat]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

5. **Adaugă a doua variabilă:**
   - Name: `DB_INIT_SECRET`
   - Value: [paste alt secret generat]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### 3. Redeploy

Після додавання secrets:
1. Du-te la **Deployments** tab
2. Click pe ultimul deployment
3. Click **Redeploy** (sau fă git push)

### 4. Salvează Secrets

**FOARTE IMPORTANT:** Salvează aceste secrets într-un loc sigur (password manager)!

```
DEBUG_SECRET=<valoarea ta aici>
DB_INIT_SECRET=<valoarea ta aici>
```

Le vei folosi pentru a accesa debug endpoints (vezi [SECURITY.md](SECURITY.md)).

---

## ✅ Verificare

După redeploy, testează că protecția funcționează:

```bash
# Încearcă fără secret (ar trebui să dea 401/403)
curl https://socrate-ai-8teu.vercel.app/api/debug/list-users

# Încearcă cu secret (ar trebui să funcționeze)
curl -H "x-debug-secret: YOUR_DEBUG_SECRET" \
  https://socrate-ai-8teu.vercel.app/api/debug/list-users
```

---

## 📋 Checklist

- [ ] Generat DEBUG_SECRET
- [ ] Generat DB_INIT_SECRET
- [ ] Adăugat ambele în Vercel Environment Variables
- [ ] Redeploy făcut
- [ ] Secrets salvate în password manager
- [ ] Testat că endpoints sunt protejate

---

## 🔗 Resurse

- **Documentație completă:** [SECURITY.md](SECURITY.md)
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

**✅ După ce faci asta, debug endpoints vor fi complet securizate!**
