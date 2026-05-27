import { test, expect } from "@playwright/test"

// Phase 1.1 smoke: captures /admin/login at 3 widths and asserts no horizontal
// overflow. Other panel routes (/admin, /empresa) redirect to /admin/login when
// not authenticated, so we exercise them anyway to capture the loading state.

const PORT = process.env.PORT ?? "3459"
const BASE = `http://localhost:${PORT}`

const SIZES = [
  { name: "mobile-375", width: 375, height: 740 },
  { name: "ipad-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const

const ROUTES = [
  { name: "admin-login", path: "/admin/login" },
  { name: "admin", path: "/admin" },
  { name: "empresa", path: "/empresa" },
]

for (const size of SIZES) {
  for (const route of ROUTES) {
    test(`${route.name} @ ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      const resp = await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" })
      expect(resp?.status() ?? 0).toBeLessThan(400)
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
