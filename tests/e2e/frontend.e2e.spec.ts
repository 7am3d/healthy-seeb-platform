import { test, expect } from '@playwright/test'

test.describe('Frontend languages', () => {
  test('the root URL redirects to Arabic, right-to-left', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ar-OM' })
    const page = await context.newPage()
    await page.goto('http://localhost:3000')

    await expect(page).toHaveURL(/\/ar$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('h1').first()).toHaveText('مرحبًا بكم في السيب الصحية')
    await context.close()
  })

  test('the English page is left-to-right', async ({ page }) => {
    await page.goto('http://localhost:3000/en')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('h1').first()).toHaveText('Welcome to Healthy Seeb')
  })

  test('the language switcher keeps the same page', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await page.getByRole('link', { name: 'Change language' }).click()

    await expect(page).toHaveURL(/\/ar$/)
  })

  test('unknown pages show the translated 404', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/en/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(page.locator('h1').first()).toHaveText('Page not found')
  })
})
