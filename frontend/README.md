# DRISHTI Web App — Phase 1 Setup

## 1. Install dependencies
```bash
npm install
npm install @next-auth/prisma-adapter
```

## 2. Set up environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
- Generate `NEXTAUTH_SECRET`: run `openssl rand -base64 32`
- Add Google OAuth credentials from https://console.cloud.google.com (optional)

## 3. Set up the database
```bash
npx prisma db push
```
This creates `dev.db` (SQLite) with all tables automatically.

## 4. Run the app
```bash
npm run dev
```
Open http://localhost:3000

---

## Phase 1 Features
- **Auth** — Email/password signup + Google OAuth via NextAuth.js
- **Patient info** — Name, age, ID saved with each scan
- **Auto-save** — Every prediction is saved to the database when logged in
- **Dashboard** — `/dashboard` shows all past scans with expandable rows
- **Grade trend chart** — Line chart showing DR grade over time (shows after 2+ scans)
- **Stat cards** — Total scans, average confidence, latest result

## Routes
| Route | Description |
|---|---|
| `/` | Upload page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Scan history + trend chart |
| `/api/predict` | Model proxy |
| `/api/scans` | Save / fetch scans |
| `/api/auth/register` | Create account |

## Project Structure
```
drishti-app/
├── app/
│   ├── page.js              ← Main upload page (auth-aware)
│   ├── layout.js            ← Root layout with SessionProvider
│   ├── globals.css
│   ├── auth.module.css      ← Shared login/register styles
│   ├── login/page.js
│   ├── register/page.js
│   ├── dashboard/
│   │   ├── page.js          ← Dashboard with history + chart
│   │   └── dashboard.module.css
│   └── api/
│       ├── predict/route.js
│       ├── scans/route.js
│       └── auth/
│           ├── [...nextauth]/route.js
│           └── register/route.js
├── components/
│   ├── SessionWrapper.js
│   ├── UploadZone.js
│   └── ResultCard.js
├── lib/
│   ├── prisma.js
│   └── auth.js
└── prisma/
    └── schema.prisma
```
