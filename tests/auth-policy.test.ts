import assert from 'node:assert/strict'
import test from 'node:test'
import { isPublicRoute } from '../app/utils/route-policy.ts'
import {
  isRecentLogin,
  isSameOrigin,
  RECENT_LOGIN_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from '../server/utils/session-policy.ts'

test('only approved routes are public', () => {
  for (const path of ['/', '/login', '/catalog', '/products/1', '/products/category/1']) {
    assert.equal(isPublicRoute(path), true, path)
  }

  for (const path of ['/dashboard', '/catalog/admin', '/product/1', '/unknown']) {
    assert.equal(isPublicRoute(path), false, path)
  }
})

test('session and recent-login windows match security policy', () => {
  assert.equal(SESSION_MAX_AGE_SECONDS, 5 * 24 * 60 * 60)
  assert.equal(RECENT_LOGIN_MAX_AGE_SECONDS, 5 * 60)
  assert.equal(isRecentLogin(700, 1_000), true)
  assert.equal(isRecentLogin(699, 1_000), false)
  assert.equal(isRecentLogin(1_001, 1_000), true)
  assert.equal(isRecentLogin(1_301, 1_000), false)
})

test('state-changing requests require an exact origin match', () => {
  assert.equal(isSameOrigin('https://example.com', 'https://example.com'), true)
  assert.equal(isSameOrigin('https://evil.example', 'https://example.com'), false)
  assert.equal(isSameOrigin(undefined, 'https://example.com'), false)
})
