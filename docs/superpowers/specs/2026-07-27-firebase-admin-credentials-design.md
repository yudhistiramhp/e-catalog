# Firebase Admin Credentials Design

**Date:** 2026-07-27
**Status:** Approved

## Goal

Provide Firebase Admin credentials for local Nuxt development while using Application Default Credentials (ADC) supplied by Firebase App Hosting in production.

## Architecture

Firebase client and Admin configuration remain separate:

- `app/config/firebase.ts` contains public Firebase Web SDK configuration behavior. It never reads service-account credentials.
- `server/utils/firebase-admin.ts` uses `applicationDefault()` and `FIREBASE_PROJECT_ID`.
- Local development sets `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of `app/config/e-catalog.json` and sets `FIREBASE_PROJECT_ID=e-catalog-project` in `.env`.
- Firebase App Hosting production supplies ADC through its runtime service account. Production does not set or deploy a private-key file.

## Secret Handling

`app/config/e-catalog.json` remains temporarily available for local development but is ignored by Git using an exact repository-root rule. Server code does not import the JSON, preventing it from entering the client bundle or application source graph.

The currently exposed service-account key must be revoked before deployment. A replacement key may be used only for local development and must remain untracked.

## Data Flow

1. Local Nuxt starts with environment variables loaded from `.env`.
2. Firebase Admin `applicationDefault()` reads the file named by `GOOGLE_APPLICATION_CREDENTIALS`.
3. `POST /api/auth/session` verifies the client ID token and creates a Firebase session cookie.
4. Production follows the same API flow, but ADC comes from Firebase App Hosting rather than a JSON key.

## Error Handling

Missing or invalid local credentials remain startup/request configuration errors from Firebase Admin. No fallback to client configuration or embedded private keys is allowed.

## Verification

- `app/config/e-catalog.json` is ignored and untracked.
- Firebase Admin can acquire local credentials through `applicationDefault()`.
- Auth policy tests pass.
- Nuxt production build succeeds.
- Manual local email/password login creates a server session.
- Firebase App Hosting deployment completes without a private-key environment variable or bundled JSON file.
