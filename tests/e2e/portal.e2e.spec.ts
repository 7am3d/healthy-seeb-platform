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

  test('staff save a new post as a draft, then edit it', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)
    await page.goto(`${BASE}/en/portal/posts/new?type=announcement`)
    await expect(page.getByRole('radio', { name: 'Announcement' })).toBeChecked()

    await page.getByRole('button', { name: 'Save as draft' }).click()
    await expect(page.getByText('Please enter a title')).toBeVisible()

    const title = `E2E draft ${Date.now()}`
    await page.fill('#post-title', title)
    await page.fill('#post-content', 'First line\n- a list item')
    await page.getByRole('button', { name: 'Save as draft' }).click()
    await expect(page).toHaveURL(/\/en\/portal\/posts\/\d+\/edit$/)
    await expect(page.locator('#post-content')).toHaveValue('First line\n- a list item')

    await page.goto(`${BASE}/en/portal/posts?type=announcement`)
    await expect(page.getByRole('cell', { name: title })).toBeVisible()
  })

  test('the committee page editor saves changes for approval', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)
    await page.goto(`${BASE}/en/portal/committee`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Edit the committee page')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'sent for approval' })).toBeVisible()
    await expect(page.getByText('changes are waiting for the portal administrator')).toBeVisible()
  })

  test('referred requests can be filtered and followed up', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)
    await page.goto(`${BASE}/en/portal/referrals`)

    await page.getByRole('button', { name: /^Completed/ }).click()
    await expect(page.getByRole('listitem')).toHaveCount(1)

    await page.getByRole('button', { name: /^All/ }).click()
    await page.getByRole('button', { name: 'View and follow up' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('New follow-up note').fill('E2E follow-up note')
    await dialog.getByRole('button', { name: 'Save follow-up' }).click()
    await expect(dialog).toBeHidden()
    await page.getByRole('button', { name: 'View and follow up' }).first().click()
    await expect(page.getByRole('dialog')).toContainText('E2E follow-up note')
  })

  test('signing out returns to the login page', async ({ page }) => {
    await signIn(page, 'en')
    await expect(page).toHaveURL(/\/en\/portal$/)
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/en\/portal\/login$/)
  })
})
