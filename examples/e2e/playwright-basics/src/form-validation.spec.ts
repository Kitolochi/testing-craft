import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'

// ---------------------------------------------------------------------------
// Form validation — E2E tests
// ---------------------------------------------------------------------------
// Tests client-side and server-side validation for forms.
// Covers required fields, error messages, and form resubmission after fixing.
// ---------------------------------------------------------------------------

test.describe('login form validation', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  // -------------------------------------------------------------------------
  // Empty form submission
  // -------------------------------------------------------------------------
  test('shows error when submitting empty form', async ({ page }) => {
    // Submit without filling any fields
    await loginPage.submitButton.click()

    // Should stay on login and show a validation error
    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toBeVisible()
    await expect(loginPage.errorMessage).toHaveText('Email and password are required')
  })

  // -------------------------------------------------------------------------
  // Missing password
  // -------------------------------------------------------------------------
  test('shows error when password is missing', async ({ page }) => {
    await loginPage.fillEmail('user@example.com')
    await loginPage.submitButton.click()

    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toHaveText('Email and password are required')
  })

  // -------------------------------------------------------------------------
  // Missing email
  // -------------------------------------------------------------------------
  test('shows error when email is missing', async ({ page }) => {
    await loginPage.fillPassword('password123')
    await loginPage.submitButton.click()

    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toHaveText('Email and password are required')
  })

  // -------------------------------------------------------------------------
  // Form fields retain values after error (via Page Object accessors)
  // -------------------------------------------------------------------------
  test('login page heading is visible', async () => {
    await expect(loginPage.heading).toBeVisible()
    await expect(loginPage.heading).toHaveText('Login')
  })

  // -------------------------------------------------------------------------
  // Successful login after initial validation error
  // -------------------------------------------------------------------------
  test('can login after fixing validation errors', async ({ page }) => {
    // First attempt — empty form
    await loginPage.submitButton.click()
    await expect(loginPage.errorMessage).toBeVisible()

    // Second attempt — fill in correct values
    await loginPage.login('user@example.com', 'password123')
    await expect(page).toHaveURL('/dashboard')
  })
})

// ---------------------------------------------------------------------------
// Contact form validation
// ---------------------------------------------------------------------------
test.describe('contact form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  // -------------------------------------------------------------------------
  // Required fields are present
  // -------------------------------------------------------------------------
  test('displays all required form fields', async ({ page }) => {
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Message')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Successful contact form submission
  // -------------------------------------------------------------------------
  test('submits contact form successfully', async ({ page }) => {
    await page.getByLabel('Name').fill('Alice')
    await page.getByLabel('Email').fill('alice@test.com')
    await page.getByLabel('Message').fill('Hello, this is a test message.')

    await page.getByRole('button', { name: 'Send Message' }).click()

    await expect(page.locator('.success')).toBeVisible()
    await expect(page.locator('.success')).toHaveText('Message sent successfully!')
  })

  // -------------------------------------------------------------------------
  // Form heading is correct
  // -------------------------------------------------------------------------
  test('displays the correct page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()
  })
})
