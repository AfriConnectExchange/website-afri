# **App Name**: AfriConnect Exchange

## Overview of Purpose and Capabilities

AfriConnect Exchange is a marketplace application with barter and escrow features. It aims to provide a secure and flexible platform for users to buy, sell, and trade goods and services.

## Detailed Outline of Project

### Style, Design, and Features

- **Marketplace:** A core feature of the application, allowing users to list and browse products and services.
- **Barter System:** Enables users to propose and accept trades for goods and services without using currency.
- **Escrow Service:** Provides a secure payment system where funds are held by a third party until the transaction is complete, ensuring trust between buyers and sellers.
- **Authentication:**
  - User sign-up with email and password, including email verification.
  - User sign-in with credentials.
  - Social authentication with Google and Facebook.
  - Password reset functionality.
- **Styling:**
  - **Background:** A very light gray (`#F5F5F5`) for a clean and minimalist look.
  - **Font:** 'Inter', a sans-serif font for modern and readable text.
  - **Layout:** Full-screen design that emphasizes empty space for a less cluttered user experience.
  - **UI Library:** Utilizes `shadcn/ui` for a set of reusable and accessible components.
- **Backend:**
  - **Database:** Supabase is used for the database, with a comprehensive schema that supports all application features.
  - **API:** The application interacts with the Supabase backend for data management and authentication.

## Current Change Plan: Complete Authentication System

### Plan and Steps

The current task is to build a complete authentication system.

1.  **Create Sign-in Page and Component:**
    -   A new page will be created at the route `/auth/signin`.
    -   A reusable `SignInCard.tsx` component will be developed to handle the sign-in logic.

2.  **Create Forgot Password Page and Component:**
    -   A new page will be created at the route `/auth/forgot-password`.
    -   A reusable `forgot-password-form.tsx` component will be developed to handle the password reset request.

3.  **Create Reset Password Page and Component:**
    -   A new page will be created at the route `/auth/reset-password`.
    -   A reusable `reset-password-form.tsx` component will be developed to handle the password reset.

4.  **Create Check Email Component:**
    -   A `CheckEmailCard.tsx` component will be created to inform users to check their email for a password reset link.

5.  **Update Auth Context:**
    -   The `auth-context.tsx` will be updated to include functions for `sendPasswordResetEmail` and `resetPassword`.
