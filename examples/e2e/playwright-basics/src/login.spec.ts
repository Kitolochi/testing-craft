import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'

// ---------------------------------------------------------------------------
// Login flow — E2E tests
// ---------------------------------------------------------------------------
// Tests the full login journey: valid credentials redirect to dashboard,
// invalid credentials show an error and stay on /login.
// Uses the Page Object Model pattern (LoginPage) to keep selectors in one place.
// ---------------------------------------------------------------------------

test.describe('login flow', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  // -------------------------------------------------------------------------
  // Happy path — valid credentials
  // -------------------------------------------------------------------------
  test('logs in with valid credentials and redirects to dashboard', async ({ page }) => {
    // Arrange & Act — fill form and submit
    await loginPage.login('user@example.com', 'password123')

    // Assert — should land on the dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Invalid credentials — stays on login with error
  // -------------------------------------------------------------------------
  test('shows error for invalid credentials', async ({ page }) => {
    await loginPage.login('wrong@example.com', 'wrongpassword')

    // Should stay on login page
    await expect(page).toHaveURL('/login')

    // Error message should be visible
    await expect(loginPage.errorMessage).toBeVisible()
    await expect(loginPage.errorMessage).toHaveText('Invalid credentials')
  })

  // -------------------------------------------------------------------------
  // Wrong password with correct email
  // -------------------------------------------------------------------------
  test('shows error when password is incorrect', async ({ page }) => {
    await loginPage.login('user@example.com', 'wrongpassword')

    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toHaveText('Invalid credentials')
  })

  // -------------------------------------------------------------------------
  // Dashboard requires auth — redirect to login if not logged in
  // -------------------------------------------------------------------------
  test('redirects to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard')

    // Should be redirected back to login
    await expect(page).toHaveURL('/login')
    await expect(loginPage.heading).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Logout clears session
  // -------------------------------------------------------------------------
  test('logout redirects to login and clears session', async ({ page }) => {
    // Log in first
    await loginPage.login('user@example.com', 'password123')
    await expect(page).toHaveURL('/dashboard')

    // Click logout
    await page.getByRole('link', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/login')

    // Verify session is cleared — dashboard should redirect to login
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
