# Firebase Google Authentication Design

**Date:** 2026-07-27
**Status:** Approved
**Target:** Firebase App Hosting

## Goal

Add Google-only Firebase authentication backed by server-verified session cookies. Protect private Nuxt pages during SSR and client navigation. Keep `/`, `/login`, `/catalog`, and `/products/**` public.

## Scope

- Google popup login.
- Server verification through Firebase Admin.
- HTTP-only session cookie lasting five days.
- Global route guard.
- Authenticated-user redirect from `/login` to `/dashboard`.
- Dashboard user identity and logout.
- All Google accounts accepted.

Email/password authentication, account allowlists, role authorization, product CRUD, and static-site support are outside scope.

## Architecture

### Browser Firebase

A client-only Firebase module initializes Firebase Auth from Nuxt public runtime configuration and exposes the Auth instance plus `GoogleAuthProvider`. Analytics is omitted because authentication does not need it and browser analytics initialization complicates SSR.

The login page calls `signInWithPopup`, obtains a fresh Firebase ID token, then exchanges that token for a server session.

### Server Firebase Admin

A server utility initializes Firebase Admin once using Application Default Credentials. Firebase App Hosting supplies credentials; `FIREBASE_PROJECT_ID` identifies the Firebase project. No service-account JSON or private key belongs in source control.

The utility verifies session cookies and returns the decoded Firebase identity. Server endpoints and server route middleware reuse this utility.

### Session API

`POST /api/auth/session`:

1. Validate same-origin request.
2. Read Firebase ID token from request body.
3. Verify token with Firebase Admin.
4. Reject tokens whose `auth_time` is older than five minutes.
5. Create a five-day Firebase session cookie.
6. Set cookie with `HttpOnly`, production-only `Secure`, `SameSite=Lax`, and path `/`.
7. Return minimal user identity.

`GET /api/auth/session` verifies the cookie and returns minimal identity, or responds with unauthorized status.

`POST /api/auth/logout` validates same-origin request and clears the session cookie. Server-side refresh-token revocation is excluded because ordinary logout only needs local session termination; add revocation when forced global sign-out becomes a requirement.

### Route Protection

A shared route-policy function classifies these paths as public:

- `/`
- `/login`
- `/catalog`
- `/products/**`

Everything else is private.

Global Nuxt route middleware checks session state during SSR and client navigation:

- Valid session visiting `/login`: redirect to `/dashboard`.
- Missing or invalid session visiting private route: redirect to `/login`.
- Public route: allow without authentication.

Server API endpoints that expose private data must independently verify session cookies. Page middleware only protects navigation; it is not API authorization.

## UI

### Login

`app/pages/login.vue` becomes Google-only. Existing email/password form, Apple copy, sign-up link, forgot-password link, and irrelevant separator are removed.

The Google button:

- Shows loading state during popup and token exchange.
- Prevents duplicate clicks.
- Reports errors in an accessible live region.
- Treats popup cancellation as a concise non-destructive message.
- Signs out Firebase client state if server session creation fails.
- Navigates to `/dashboard` after successful session creation.

### Dashboard

`app/pages/dashboard/index.vue` displays minimal signed-in identity: display name, email, and optional avatar. Logout button:

1. Calls server logout endpoint.
2. Signs out Firebase browser Auth.
3. Clears client auth state.
4. Navigates to `/login`.

Logout failure remains visible and leaves user on dashboard rather than claiming success.

## Security

- Session cookie remains inaccessible to browser JavaScript.
- Session endpoint accepts only recently authenticated ID tokens.
- State-changing auth endpoints validate request origin.
- Production cookie uses HTTPS-only transport.
- Firebase Admin verifies every private server request.
- Secrets stay in deployment credentials/environment, never public runtime config.
- Firebase web configuration remains public by design; Firebase Security Rules and server authorization provide security.

All Google accounts may access dashboard by explicit product decision. Add email/domain/claim authorization before dashboard contains sensitive administration capabilities.

## Configuration

Nuxt public runtime configuration contains Firebase browser values:

- API key
- Auth domain
- Project ID
- Storage bucket
- Messaging sender ID
- App ID

Server environment contains `FIREBASE_PROJECT_ID`. Firebase App Hosting supplies Application Default Credentials.

Google sign-in provider must be enabled in Firebase Authentication. App Hosting domain and local development domain must be listed as authorized domains.

## Error Handling

- Popup canceled/closed: show concise message; permit retry.
- Firebase login failure: show sanitized message; permit retry.
- Session exchange failure: sign out browser Auth; preserve error.
- Expired/invalid cookie: clear local session state and redirect private navigation to `/login`.
- Logout failure: retain current page and report error.

No raw Firebase or server error details are exposed to users.

## Verification

One small route-policy test verifies:

- `/`, `/login`, `/catalog`, and `/products/1` are public.
- Nested `/products/...` routes remain public.
- `/dashboard` and unknown application pages require auth.

Run Nuxt typecheck/build plus route-policy test. Manual acceptance checks:

1. Anonymous visitor can open every public route.
2. Anonymous visitor opening `/dashboard` reaches `/login`.
3. Google login creates session and reaches `/dashboard`.
4. Authenticated visitor opening `/login` reaches `/dashboard`.
5. Refreshing `/dashboard` remains authenticated during SSR.
6. Logout clears session and blocks `/dashboard`.
7. Expired or malformed cookie redirects private route to `/login`.

## Deployment Constraint

This design requires a Nuxt server runtime. Firebase App Hosting satisfies that requirement. `nuxt generate` with static Firebase Hosting cannot provide server-verified session cookies or SSR authorization.