# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Firebase Authentication

Authentication uses Firebase Email/Password in browser, then exchanges Firebase ID tokens for five-day HTTP-only server session cookies.

### Firebase Console

1. Open **Authentication > Sign-in method** and enable **Email/Password**.
2. Create dashboard accounts under **Authentication > Users**.

### Local development

Firebase Admin uses Application Default Credentials. Install Google Cloud CLI, then run:

```sh
gcloud auth application-default login
```

Create an untracked `.env`:

```dotenv
FIREBASE_PROJECT_ID=e-catalog-project
```

Start Nuxt:

```sh
npm run dev
```

### Verification

```sh
npm run test:auth
npm run build
```

### Deployment

Deploy with Firebase App Hosting or another Nuxt server runtime. Set `FIREBASE_PROJECT_ID=e-catalog-project` in runtime environment. Do not commit service-account JSON or private keys. Static Firebase Hosting with `nuxt generate` cannot provide server-verified sessions.
