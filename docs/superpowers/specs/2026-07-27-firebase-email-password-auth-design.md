# Firebase Email/Password Authentication Design

**Date:** 2026-07-27
**Status:** Approved

## Goal

Replace Google popup authentication with email/password login while retaining server-verified five-day Firebase session cookies and existing route protection.

## Scope

- Login only through Firebase Email/Password.
- Accounts created manually in Firebase Console.
- No public registration.
- No password-reset flow.
- Existing dashboard, logout, public-route policy, server session API, and Firebase Admin verification remain unchanged.

## Client Architecture

`app/config/firebase.ts` returns only Firebase Auth. `GoogleAuthProvider` is removed.

`app/plugins/firebase.client.ts` injects only `$firebaseAuth`. Google provider injection is removed.

`app/pages/login.vue` uses `signInWithEmailAndPassword`. After Firebase authenticates credentials, the page requests a fresh ID token and posts it to the existing `POST /api/auth/session` endpoint. The endpoint verifies the ID token, enforces recent authentication, creates the HTTP-only session cookie, and returns session identity. Successful login updates shared session state and navigates to `/dashboard`.

The server does not receive or process the raw password. Firebase client Auth owns credential verification.

## Login UI

The login card contains:

- Email input with `type="email"`, autocomplete `email`, and required validation.
- Password input with `type="password"`, autocomplete `current-password`, and required validation.
- Submit button with loading state and duplicate-submit prevention.
- Accessible live error region.

No Google button, Google icon, account registration, or forgot-password link remains.

## Error Handling

All credential failures display `Email atau password salah.`. This avoids exposing whether an email exists. Unexpected session creation failures display `Login gagal. Silakan coba lagi.`.

If Firebase login succeeds but session creation fails, browser Firebase Auth signs out and shared session state becomes anonymous. Inputs remain available for retry.

## Security

- Password is sent only to Firebase Authentication through its client SDK.
- Existing ID-token verification, five-minute recent-login check, exact-origin check, and HTTP-only session cookie remain.
- Session lifetime remains five days.
- Existing production cookie attributes remain `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`.
- Login form never distinguishes unknown email from wrong password.
- Firebase Email/Password provider must be enabled manually.
- Dashboard access remains available to every Firebase Email/Password account created in project.

## Verification

Automated checks:

- Existing auth policy tests continue passing.
- Production build succeeds.
- Search confirms no `GoogleAuthProvider`, `signInWithPopup`, `$googleAuthProvider`, or Google login copy remains in active auth source.

Manual checks using a Firebase Console-created account:

1. Valid credentials create session and navigate to `/dashboard`.
2. Invalid email/password shows generic credential error.
3. Refreshing `/dashboard` preserves SSR session.
4. Authenticated `/login` redirects to `/dashboard`.
5. Logout clears session and returns to `/login`.
6. `/`, `/catalog`, and `/products/**` remain public.
