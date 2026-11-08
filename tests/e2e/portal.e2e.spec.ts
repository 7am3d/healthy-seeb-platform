import { expect, test, type Page } from '@playwright/test'

// Needs the development seed data: npm run seed:dev
const STAFF = { email: 'test@seebhealthy.om', password: 'Seeb@2026' }
const BASE = 'http://localhost:3000'

async function signIn(page: Page, locale: 'ar' | 'en', password = STAFF.password) {
  await page.goto(`${BASE}/${locale}/portal/login`)
  await page.fill('#staff-email', STAFF.email)
  await page.fill('#staff-password', password)
  await page.click('button[type=submit]')
}

test.describe('Staff portal', () => {
  test('portal pages require signing in', async ({ page }) => {
    await page.goto(`${BASE}/en/portal/posts`)
    await expect(page).toHaveURL(/\/en\/portal\/login$/)
  })

  test('a wrong password shows an error', async ({ page }) => {
    await signIn(page, 'en', 'wrong-password')
    await expect(page.locator('form [role=alert]')).toHaveText(
      'The email or password is incorrect.',
    )
  })

  test('staff sign in to the Arabic dashboard', async ({ page }) => {
    await signIn(page, 'ar')
    await expect(page).toHaveURL(/\/ar\/portal$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('لوحة التحكم')
  })

  test('posts can be filtered by type and searched', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)

    await page.goto(`${BASE}/en/portal/posts?type=report`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reports')
    for (const cell of await page.locator('tbody tr td:nth-child(2)').all()) {
      await expect(cell).toHaveText('Report')
    }

    await page.fill('#posts-search', 'zzz-no-such-post')
    await page.keyboard.press('Enter')
    await expect(page.getByText('No matching posts.')).toBeVisible()
  })

  test('signing out returns to the login page', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/en\/portal\/login$/)
  })
})
