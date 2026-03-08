import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'

// ---------------------------------------------------------------------------
// Navigation — E2E tests
// ---------------------------------------------------------------------------
// Verifies that clicking links navigates to the correct pages, page content
// loads as expected, and the navigation bar is consistent across pages.
// ---------------------------------------------------------------------------

test.describe('public page navigation', () => {
  // -------------------------------------------------------------------------
  // About page loads and displays content
  // -------------------------------------------------------------------------
  test('navigates to about page', async ({ page }) => {
    await page.goto('/about')

    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
    await expect(page.getByText('demo application')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Contact page loads and displays form
  // -------------------------------------------------------------------------
  test('navigates to contact page', async ({ page }) => {
    await page.goto('/contact')

    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Navigation links between public pages
  // -------------------------------------------------------------------------
  test('clicks nav link from about to contact', async ({ page }) => {
    await page.goto('/about')

    // Click the Contact link in the nav
    await page.getByRole('link', { name: 'Contact' }).click()

    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()
  })

  test('clicks nav link from contact to about', async ({ page }) => {
    await page.goto('/contact')

    await page.getByRole('link', { name: 'About' }).click()

    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Root URL redirects to login
  // -------------------------------------------------------------------------
  test('root URL redirects to login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })

  // -------------------------------------------------------------------------
  // Page titles match expected values
  // -------------------------------------------------------------------------
  test('about page has correct title', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle('About')
  })

  test('contact page has correct title', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveTitle('Contact')
  })

  test('login page has correct title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle('Login')
  })
})

// ---------------------------------------------------------------------------
// Authenticated navigation
// ---------------------------------------------------------------------------
test.describe('authenticated navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test in this group
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('user@example.com', 'password123')
    await expect(page).toHaveURL('/dashboard')
  })

  // -------------------------------------------------------------------------
  // Dashboard nav bar links work
  // -------------------------------------------------------------------------
  test('navigates from dashboard to about via nav', async ({ page }) => {
    await page.getByRole('link', { name: 'About' }).click()

    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  })

  test('navigates from dashboard to contact via nav', async ({ page }) => {
    await page.getByRole('link', { name: 'Contact' }).click()

    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Dashboard page has correct title
  // -------------------------------------------------------------------------
  test('dashboard page has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Dashboard')
  })

  // -------------------------------------------------------------------------
  // Nav bar is consistent across pages
  // -------------------------------------------------------------------------
  test('nav contains expected links on dashboard', async ({ page }) => {
    const nav = page.locator('nav')

    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible()
  })

  test('nav contains expected links on about page', async ({ page }) => {
    await page.goto('/about')
    const nav = page.locator('nav')

    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible()
  })
})
