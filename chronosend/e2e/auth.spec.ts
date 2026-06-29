import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('ChronoSend')).toBeVisible();
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation errors on empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email and password are required')).toBeVisible();
  });

  test('should switch between login and register tabs', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Register').click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await page.getByText('Sign In').click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should login and redirect to dashboard', async ({ page }) => {
    // Mock the login API
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'test-token',
            user: { id: '1', email: 'demo@chronosend.app', role: 'user' },
          },
        }),
      });
    });

    // Mock the stats API for dashboard
    await page.route('**/api/v1/messages/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_pending: 3,
            sent_today: 5,
            failed_today: 1,
            next_scheduled: null,
            recent: [],
            stats: { total: 10, pending: 3, sent: 5, failed: 1, cancelled: 1, by_platform: { telegram: 2, email: 4, sms: 3, whatsapp: 1 } },
          },
        }),
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@chronosend.app');
    await page.fill('input[type="password"]', 'User1234!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid email or password',
        }),
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'WrongPass1!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});
