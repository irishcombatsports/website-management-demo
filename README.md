# Training Club Template

A reusable, unbranded training business website and member management system for fitness gyms, PT studios, small group training, martial arts clubs, boxing gyms, and general sports clubs.

The default placeholder brand is:

- Club name: Training Club
- Tagline: Start Your Training Journey
- Address: 123 Main Street, Your Town
- Email: hello@trainingclub.example
- Instagram: @trainingclub
- Primary colour: purple, configurable in `frontend/src/config.js` and `app_settings`

## Features

- React + Vite frontend with public home, schedule, merch/equipment, waiting list, terms, and privacy pages.
- Node.js + Express backend with SQLite.
- JWT auth, bcrypt password hashing, registration, login, logout, forgot/reset password.
- Member dashboard with profile completion, waiver, membership status, discounts, and contact shortcuts.
- Adult waiver signing with timestamp storage and admin visibility.
- Admin dashboard with stats, needs-action panels, notifications, contact messages, waiting list, members, profile modal, manual payments, coach status, and member deletion.
- Admin class sign-in with duplicate prevention, attendance history, 2-classes-per-week cap for limited memberships, and optional restricted-class exclusion.
- Merch/equipment pre-order form stored in SQLite.
- Waiting-list mode with statuses: waiting, contacted, invited, joined, removed.
- Optional Stripe Checkout. Offline payment mode is supported by default.
- Email hooks for welcome, waiver, payment, password reset, contact, waiting list, free trial, drop-in, merch pre-order, and renewals.
- Railway-friendly deployment files.

## Local Setup

```bash
cd /Users/evan/combat-club-template
npm run install:all
cp backend/.env.example backend/.env
```

Set at least:

```bash
JWT_SECRET=replace_with_a_long_random_string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password
FRONTEND_URL=http://localhost:5173
PAYMENT_MODE=offline
STRIPE_ENABLED=false
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Demo Admin Account

On backend startup, if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, the backend creates or updates that user as an admin.

Use those credentials at `/login`, then open `/admin`.

## Database

The app uses SQLite via `better-sqlite3`.

Default local path:

```bash
backend/data/club.db
```

Override with:

```bash
DATABASE_PATH=/data/club.db
```

Tables include `users`, `memberships`, `password_resets`, `contact_messages`, `admin_notifications`, `attendance`, `merch_pre_orders`, `waiting_list`, and `app_settings`.

## Configuration

Frontend placeholder defaults live in:

```bash
frontend/src/config.js
```

Backend defaults are seeded into `app_settings` from:

```bash
backend/src/db/database.js
```

Configurable values include club name, address, email, Instagram, logo path, primary colour, class schedule, membership prices, payment mode, Stripe enabled, and waiting-list enabled.

## Payments

Offline mode is the default:

```bash
PAYMENT_MODE=offline
STRIPE_ENABLED=false
```

In offline mode, member-facing wording tells users:

- Membership is arranged directly with the club.
- Speak to the coach before attending your first class.

To enable Stripe, set:

```bash
PAYMENT_MODE=online
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_...
```

Monthly memberships expire at the end of the calendar month. If buying in the final week, the checkout flow supports starting this month or next month.

## Email

SMTP and Resend are supported through environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hello@example.com
EMAIL_PASS=your_app_password
RESEND_API_KEY=
RESEND_FROM=
```

If email is not configured, app actions still save to the database; failed email sends are logged.

## Railway Deployment

1. Create a Railway project from this repo.
2. Add environment variables from `backend/.env.example`.
3. Set a persistent SQLite path:

```bash
DATABASE_PATH=/data/club.db
```

4. Deploy. The root `package.json` builds the frontend and starts the backend.

The backend serves `frontend/dist` in production.

## Adapting For A Club

Replace placeholders in:

- `frontend/src/config.js`
- `backend/src/db/database.js` default settings
- `frontend/public` if adding a real logo or training images
- `frontend/index.html` title and meta description

Keep real club photos, logos, payment keys, and email credentials out of version control.
