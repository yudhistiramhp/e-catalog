import assert from 'node:assert/strict'
import test from 'node:test'

test('Firebase Admin utility imports without service-account environment variables', async () => {
  delete process.env.FIREBASE_PROJECT_ID
  delete process.env.FIREBASE_CLIENT_EMAIL
  delete process.env.FIREBASE_PRIVATE_KEY

  const module = await import('../server/utils/firebase-admin.ts')

  assert.equal(typeof module.getFirebaseAdminAuth, 'function')
})
