import { test, expect } from "@playwright/test"

// Phase 1.1 smoke: captures the real admin login and legacy panel entrypoints
// at 3 widths. /admin and /empresa are legacy routes whose canonical target is
// /coach; unauthenticated users then land on /admin/login.

const SIZES = [
  { name: "mobile-375", width: 375, height: 740 },
  { name: "ipad-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const

const ROUTES = [
  { name: "admin-login", path: "/admin/login", finalPath: /\/admin\/login$/ },
  { name: "admin", path: "/admin", finalPath: /\/admin\/login$/ },
  { name: "empresa", path: "/empresa", finalPath: /\/admin\/login$/ },
]

for (const size of SIZES) {
  for (const route of ROUTES) {
    test(`${route.name} @ ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      const resp = await page.goto(route.path, { waitUntil: "domcontentloaded" })
      expect(resp?.status() ?? 0).toBeLessThan(400)
      await page.waitForURL(route.finalPath)
      await page.locator("body").waitFor({ state: "visible" })
      await page.screenshot({
        path: `playwright-report/phase1.1/${route.name}-${size.name}.png`,
        fullPage: false,
      })
      // No horizontal overflow at any breakpoint.
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      expect(overflow).toBe(false)
    })
  }
}
