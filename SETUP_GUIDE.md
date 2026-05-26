# XRP Command Pro — Setup Guide
## Professional Trading Intelligence Terminal

---

## What This Includes

### Dashboard (7 tabs)
- **Overview** — Price, 8 market stats, 30-day chart, signal gauge, MA/BB/supply summary
- **Technicals** — Moving averages, RSI(14), RSI(7), Bollinger Bands with squeeze alert, momentum bars
- **Macro** — BTC price/dominance, XRP alpha vs BTC, Fear & Greed Index with trend
- **Fibonacci** — Full retracement + extension levels (0.236 → 1.618), nearest level highlighted
- **Position** — Size calculator with R:R ratio, 7 professional risk rules
- **Journal** — Timestamped trade log with price + score snapshot
- **AI** — Claude analysis: Market Structure, Key Signals, Critical Levels, Trade Scenarios, Derivatives/Sentiment, Recommendation

### Daily Email (automated, no Make.com needed)
Sent every day at 12:00 UTC via Vercel Cron + Resend:
- Price hero with signal score
- 6-stat grid (7d, 30d, volume, MCap, RSI, Fear & Greed)
- Macro table (BTC, dominance, XRP alpha, sentiment momentum)
- Technical levels table (MAs, VWAP, Bollinger Bands, Fibonacci)
- Full Claude AI analysis (6 sections)

---

## PART 1 — Deploy to Vercel

### Step 1: Create GitHub repository
1. Go to https://github.com → sign in → click "+" → "New repository"
2. Name: `xrp-command-pro` | Set to Public | Click "Create repository"

### Step 2: Upload files
Upload all files maintaining this structure:
```
xrp-command-pro/
├── package.json
├── next.config.js
├── vercel.json
├── .env.local          ← DO NOT commit this (add to .gitignore)
└── src/
    └── app/
        ├── layout.js
        ├── page.js
        └── api/
            ├── xrp/
            │   └── route.js
            └── cron/
                └── route.js
```

### Step 3: Add .gitignore (important — keeps secrets safe)
Create a file called `.gitignore` in the root with:
```
.env.local
.env
node_modules/
.next/
```

### Step 4: Deploy to Vercel
1. Go to https://vercel.com → sign up with GitHub
2. Click "Add New Project" → select `xrp-command-pro`
3. Click "Deploy" — Vercel auto-detects Next.js

### Step 5: Set Environment Variables in Vercel
In your Vercel project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | Your key from https://console.anthropic.com |
| `RESEND_API_KEY` | Your key from https://resend.com (free) |
| `ALERT_EMAIL` | Your email address |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app-name.vercel.app` |
| `CRON_SECRET` | Any random string (e.g. `abc123xyz789`) |

### Step 6: Redeploy
After adding env vars: Deployments tab → click the three dots → "Redeploy"

✅ Your dashboard is now live!

---

## PART 2 — Set Up Daily Email

### Get a free Resend account
1. Go to https://resend.com and sign up (free)
2. Go to API Keys → Create API Key → copy it
3. Add it to Vercel as `RESEND_API_KEY`

### Set up your sending domain (recommended)
In Resend → Domains → Add Domain → follow DNS instructions
Then update the `from` field in `src/app/api/cron/route.js`:
```
from: 'XRP Command <briefing@yourdomain.com>'
```
If you don't have a domain, Resend provides a free `@resend.dev` address for testing.

### The cron schedule
`vercel.json` is already configured to run daily at 12:00 UTC (7 AM Eastern, 8 AM Central).
To change the time, edit the `schedule` field in `vercel.json`:
```json
"schedule": "0 12 * * *"
```
Format: `minute hour * * *` (UTC time)
- 8 AM Eastern = `0 13 * * *`
- 6 AM Central = `0 12 * * *`
- 9 AM Pacific = `0 17 * * *`

### Test the email manually
After deploying, visit:
```
https://your-app.vercel.app/api/cron
```
With the header: `Authorization: Bearer your_cron_secret`

Or use curl:
```bash
curl -H "Authorization: Bearer your_cron_secret" https://your-app.vercel.app/api/cron
```

---

## PART 3 — Data Sources

| Data | Source | Cost | Refresh |
|------|---------|------|---------|
| XRP price, volume, MCap | CoinGecko API | Free | 5 min |
| 30-day price history | CoinGecko API | Free | 5 min |
| RSI, MA, Bollinger Bands | Calculated server-side | Free | 5 min |
| Fibonacci levels | Calculated server-side | Free | 5 min |
| VWAP | Calculated from OHLC data | Free | 5 min |
| BTC price + dominance | CoinGecko API | Free | 5 min |
| Fear & Greed Index | Alternative.me API | Free | Daily |
| AI Analysis | Anthropic Claude API | ~$0.003/analysis | On demand |
| Daily email | Resend API | Free (100/day) | Daily |

**Monthly cost estimate:** $0–$2 (only Anthropic API calls cost money, ~$0.003 each)

---

## Troubleshooting

**Dashboard shows no data**
→ Check Vercel function logs: Project → Functions tab → click `/api/xrp`
→ CoinGecko free tier allows 10-30 calls/minute — well within limits

**AI analysis fails**
→ Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
→ Check it starts with `sk-ant-`

**Email not arriving**
→ Check spam folder first
→ In Vercel logs, check `/api/cron` for error messages
→ Verify `RESEND_API_KEY` and `ALERT_EMAIL` are set correctly
→ Make sure `CRON_SECRET` matches what you set in Vercel

**Fibonacci levels look wrong**
→ They're calculated from the 30-day high/low. In sideways markets the range may be narrow — this is expected.

---

## Quick Reference

| What | URL |
|------|-----|
| Your dashboard | `https://your-app.vercel.app` |
| Anthropic Console | `https://console.anthropic.com` |
| Resend Dashboard | `https://resend.com` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| CoinGecko API docs | `https://docs.coingecko.com` |
