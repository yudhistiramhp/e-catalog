# Firebase Admin Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Firebase Admin session creation work locally through Application Default Credentials while preserving keyless Firebase App Hosting production authentication.

**Architecture:** Keep Firebase Admin isolated in server code and continue using `applicationDefault()`. Local `.env` points Google ADC to the temporary service-account JSON; Firebase App Hosting supplies ADC from its runtime service account in production.

**Tech Stack:** Nuxt 4, Firebase Admin SDK 14, Firebase App Hosting, Node.js test runner

## Global Constraints

- Never import `app/config/e-catalog.json` from application source.
- Never copy service-account fields into `app/config/firebase.ts`; that file remains client-only.
- Keep `server/utils/firebase-admin.ts` on `applicationDefault()`.
- Keep `app/config/e-catalog.json` local and untracked.
- Production uses Firebase App Hosting runtime ADC; no private-key file deployment.
- Revoke exposed key ID `19a924ee6f1859ea6eb43cbe60b80a1a317e7bd9` before production deployment.
- Do not commit unless explicitly requested.

---

### Task 1: Configure Local Firebase Admin Credentials

**Files:**
- Modify: `.gitignore:21-24`
- Create: `.env`
- Verify unchanged: `server/utils/firebase-admin.ts`
- Verify: `tests/auth-policy.test.ts`

**Interfaces:**
- Consumes: `GOOGLE_APPLICATION_CREDENTIALS` and `FIREBASE_PROJECT_ID` process environment variables.
- Produces: local ADC available to `applicationDefault()`; no application API changes.

- [ ] **Step 1: Protect the temporary credential file**

Append exact root-relative rule to `.gitignore`:

```gitignore
# Firebase Admin local credentials
/app/config/e-catalog.json
```

- [ ] **Step 2: Verify the credential file is ignored and untracked**

Run:

```bash
git check-ignore -v app/config/e-catalog.json
git ls-files --error-unmatch app/config/e-catalog.json
```

Expected:

- `git check-ignore` prints `.gitignore` rule matching `app/config/e-catalog.json`.
- `git ls-files` exits non-zero because file is not tracked.

- [ ] **Step 3: Configure local ADC**

Create `.env` without copying any JSON fields:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=E:/code/e-catalog-2/app/config/e-catalog.json
FIREBASE_PROJECT_ID=e-catalog-project
```

`.env` is already covered by existing `.gitignore` rules.

- [ ] **Step 4: Verify Firebase Admin source remains server-only and uses ADC**

Confirm `server/utils/firebase-admin.ts` remains:

```ts
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const app = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
})

export const firebaseAdminAuth = getAuth(app)
```

Run:

```bash
rg "e-catalog\.json|private_key|client_email" app server nuxt.config.ts --glob '!app/config/e-catalog.json'
```

Expected: no matches.

- [ ] **Step 5: Verify local credential can mint an OAuth2 access token**

Run from Git Bash after `.env` exists:

```bash
node --env-file=.env --input-type=module -e "import { applicationDefault } from 'firebase-admin/app'; const token = await applicationDefault().getAccessToken(); if (!token.access_token) throw new Error('Missing access token'); console.log('Firebase Admin credential OK')"
```

Expected:

```text
Firebase Admin credential OK
```

Do not print token content.

- [ ] **Step 6: Run automated verification**

Run:

```bash
npm run test:auth && npm run build
```

Expected: 3 auth tests pass; Nuxt build exits 0. Dependency deprecation warnings may remain.

- [ ] **Step 7: Run local login smoke test**

Restart development server so Nuxt loads `.env`:

```bash
npm run dev
```

Use a valid Firebase Email/Password account, submit `/login`, then verify:

- `POST /api/auth/session` returns 200.
- Browser navigates to `/dashboard`.
- Refreshing `/dashboard` preserves session.
- Server output contains no ADC credential error.

Stop development server after verification.

- [ ] **Step 8: Verify production boundary before deployment**

In Firebase App Hosting configuration, do not define `GOOGLE_APPLICATION_CREDENTIALS` and do not upload `app/config/e-catalog.json`. Deploy only after revoking the exposed key. Runtime service account supplies ADC automatically.

No commit in this task unless explicitly requested.
