import { type Page, type Locator } from '@playwright/test'

// ---------------------------------------------------------------------------
// Page Object Model — LoginPage
// ---------------------------------------------------------------------------
// Encapsulates all selectors and actions for the /login page.
// Tests interact with this class instead of using raw selectors, so if the
// HTML structure changes only this file needs updating.
//
// Pattern highlights:
// - Locators are defined once as readonly properties
// - Actions (fill, submit) are methods that return void or the next page URL
// - No assertions here — assertions belong in test files
// ---------------------------------------------------------------------------

export class LoginPage {
  // Locators — resolved lazily by Playwright, safe to store as properties
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly heading: Locator

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Log in' })
    this.errorMessage = page.locator('.error')
    this.heading = page.getByRole('heading', { name: 'Login' })
  }

  // Navigate to the login page
  async goto() {
    await this.page.goto('/login')
  }

  // Fill in the email field
  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  // Fill in the password field
  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  // Fill both fields and submit the form
  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submitButton.click()
  }
}
