import { expect, test } from '@playwright/test'

// Needs the development seed data: npm run seed:dev
const BASE = 'http://localhost:3000'

test.describe('Public website', () => {
  test('the home page lists the committees and links to each page', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    await page.locator('a[href="/en/committees/health"]').first().click()
    await expect(page).toHaveURL(/\/en\/committees\/health$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('committee page tabs switch with the mouse and the keyboard', async ({ page }) => {
    await page.goto(`${BASE}/en/committees/health`)
    const tabs = page.getByRole('tablist', { name: 'Committee page sections' })
    await tabs.getByRole('tab', { name: 'Responsibilities' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('responsibilities')

    await page.keyboard.press('ArrowRight')
    await expect(tabs.getByRole('tab', { name: 'Announcements' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('the suggestion form checks the email and sends the suggestion', async ({ page }) => {
    await page.goto(`${BASE}/en/committees/health`)
    await page.getByRole('button', { name: 'Submit a suggestion' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: 'Send' }).click()
    await expect(dialog.getByText('Please enter a valid email address')).toBeVisible()

    await dialog.getByLabel('Email').fill('e2e-visitor@example.com')
    await dialog
      .getByLabel('Your suggestion')
      .fill('An end-to-end test suggestion for the committee.')
    await dialog.getByRole('button', { name: 'Send' }).click()
    await expect(dialog.getByRole('status')).toContainText("we've received your suggestion")
  })

  test('the contribute form checks the required fields', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    await page.getByRole('button', { name: 'Contribute with us' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Send request' }).click()
    await expect(dialog.getByText('Please enter your name.')).toBeVisible()

    // One message at a time, as in the design: the next missing item is the terms checkbox.
    await dialog.getByLabel('Full name').fill('E2E Visitor')
    await dialog.getByLabel('Email').fill('e2e-visitor@example.com')
    await dialog.getByLabel('Short description').fill('I would like to volunteer at events.')
    await dialog.getByRole('button', { name: 'Send request' }).click()
    await expect(dialog.getByText('Please accept the terms and conditions.')).toBeVisible()
  })
})
