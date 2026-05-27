import { test, expect } from '@playwright/test'

test.describe('/acesso-pausado language + reason (gap B parcial + C)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/cerebroguto.onrender.com/**', (route) => route.abort())
    await page.route('**/api/guto/**', (route) => route.abort())
  })

  test('pt-BR default (paused) reason', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=pt-BR')
    await expect(page.getByRole('heading', { name: 'Acesso Pausado' })).toBeVisible()
    await expect(page.getByText('Fale com seu coach para reativar.')).toBeVisible()
  })

  test('en-US paused', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=en-US&reason=ACCESS_PAUSED')
    await expect(page.getByRole('heading', { name: 'Access Paused' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
  })

  test('it-IT paused', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=it-IT&reason=ACCESS_PAUSED')
    await expect(page.getByRole('heading', { name: 'Accesso in Pausa' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Riprova' })).toBeVisible()
  })

  test('pt-BR deceased reason', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=pt-BR&reason=GUTO_DECEASED')
    await expect(page.getByRole('heading', { name: 'O GUTO apagou' })).toBeVisible()
    await expect(page.getByText('Apenas o admin pode liberar um novo acesso.')).toBeVisible()
  })

  test('en-US expired reason', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=en-US&reason=SUBSCRIPTION_EXPIRED')
    await expect(page.getByRole('heading', { name: 'Access Expired' })).toBeVisible()
  })

  test('it-IT deceased reason', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=it-IT&reason=GUTO_DECEASED')
    await expect(page.getByRole('heading', { name: 'GUTO si è spento' })).toBeVisible()
  })

  test('falls back to paused for unknown reason code', async ({ page }) => {
    await page.goto('/acesso-pausado?lang=pt-BR&reason=NONSENSE')
    await expect(page.getByRole('heading', { name: 'Acesso Pausado' })).toBeVisible()
  })

  test('resolves language from localStorage when no query', async ({ page }) => {
    await page.goto('/acesso-pausado')
    await page.evaluate(() => {
      localStorage.setItem('guto-selected-language', 'en-US')
    })
    await page.goto('/acesso-pausado')
    await expect(page.getByRole('heading', { name: 'Access Paused' })).toBeVisible()
  })
})
