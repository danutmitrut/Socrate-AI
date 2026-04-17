# Socrate AI

App conversațional maieutic (metoda socratică), cu autentificare, abonamente, anti-abuz. **LIVE în producție pe Vercel.**

## Stack
- **Frontend:** HTML + Alpine.js + Tailwind CSS (static, nu e SPA React)
- **Backend:** Vercel Serverless Functions (Node.js 18+, `api/`)
- **DB:** Vercel Postgres (Neon)
- **AI:** OpenAI Assistant API (GPT-4)
- **Plăți:** Stripe (live mode, webhook fixat)
- **Email:** Mailersend (reset password, security alerts)
- **Auth:** JWT + bcrypt

## Structură
- `index.html`, `auth.html` , UI (nu Next.js, HTML static cu Alpine)
- `app.js` , logica frontend
- `api/` , Serverless functions (endpoints /api/...)
- `STRATEGY_FREE_TIER_V2.md`, `STRIPE_*_GUIDE.md` , strategie de monetizare
- `PROJECT_STATE.md` , ultimul snapshot de status

## Modele de abonament
- **Free:** 20 mesaje + 72h acces, **1 cont per IP** (anti-abuz)
- **Paid:** 300 mesaje/lună la 29 RON

## Reguli specifice

- **NU refactoriza către Next.js sau React SPA** , stack-ul HTML + Alpine e intenționat (simplu, rapid, SEO-friendly)
- Orice schimbare la Stripe webhook , testează pe staging înainte (webhook-ul e delicat, deja fixat)
- Modificări la auth/JWT , păstrează backward compatibility pentru userii existenți (token-uri live)
- **NU introduce alt model AI** fără discuție , e pe OpenAI Assistant API cu system prompt tuned pe metoda socratică
- Date sensibile (stripe keys, JWT secret, postgres URL) sunt în Vercel env vars, niciodată în repo
- Pentru debug prod: Vercel Dashboard → Logs (nu local)

## Deploy

```
vercel --prod
```

Sau prin Vercel dashboard connection la git push main.
