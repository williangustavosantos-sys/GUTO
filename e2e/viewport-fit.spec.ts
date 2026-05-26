import { test, expect } from '@playwright/test'

// Fase 3 — BUG 2: o layout do chat/nav no iPhone depende de env(safe-area-inset-*),
// que só resolve em valores reais com viewport-fit=cover. Sem isso, num iPhone com
// notch/home-indicator os insets viram 0 e a ancoragem do input/altura da nav erra.
// Este teste prova que o meta viewport renderiza com viewport-fit=cover.
//
// LIMITAÇÃO: Playwright/headless NÃO simula o teclado real do iOS Safari. O
// comportamento de teclado aberto (input sobe, balões não ficam atrás, nav some)
// precisa ser validado MANUALMENTE no iPhone — ver docs/QA_IPHONE_FASE3.md.

test.describe('Fase 3 BUG 2 — viewport-fit=cover (safe-area no iPhone)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/cerebroguto.onrender.com/**', (route) => route.abort())
    await page.route('**/api/guto/**', (route) => route.abort())
  })

  test('o meta viewport inclui viewport-fit=cover', async ({ page }) => {
    await page.goto('/login?lang=pt-BR')
    const content = await page
      .locator('meta[name="viewport"]')
      .first()
      .getAttribute('content')
    expect(content, 'meta viewport deve existir').toBeTruthy()
    expect(content!.replace(/\s/g, '')).toContain('viewport-fit=cover')
  })
})
