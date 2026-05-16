// Replaced by guto.spec.ts — all GUTO E2E tests live there.
import { test, expect } from '@playwright/test'

test('app responde na raiz', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBeLessThan(500)
})
