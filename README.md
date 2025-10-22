# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Auth & Device Setup

This project includes an authentication and device/session management system.

Environment variables required:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- PRIVATE_SUPABASE_SERVICE_KEY
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

Install new dependencies (minimum):

npm install bcryptjs

React Email templates were scaffolded using `npx create-email` into the `react-email-starter` folder. If you want to use React Email packages directly, refer to the starter's `package.json` for compatible versions (the starter includes `@react-email/components@0.5.7` and `react-email@4.3.1`).

Run dev:

npm run dev

API endpoints:

- POST /api/auth/register-device
- GET /api/auth/list-devices
- POST /api/auth/revoke-session
- POST /api/auth/send-email

