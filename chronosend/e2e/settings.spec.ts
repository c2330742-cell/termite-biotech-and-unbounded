import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'test-token',
            user: { id: '1', email: 'test@test.com', role: 'user' },
          },
        }),
      });
    });

    // Mock settings
    await page.route('**/api/v1/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'creds-1',
              email_address: 'test@gmail.com',
              twilio_phone_number: '+1234567890',
              twilio_whatsapp_number: null,
              whatsapp_method: 'twilio',
              timezone: 'UTC',
              updated_at: new Date().toISOString(),
              telegram_bot_token_preview: null,
              email_app_password_preview: null,
              twilio_account_sid_preview: null,
              twilio_auth_token_preview: null,
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'creds-1',
              email_address: 'test@gmail.com',
              twilio_phone_number: '+1234567890',
              twilio_whatsapp_number: null,
              whatsapp_method: 'twilio',
              timezone: 'America/New_York',
              updated_at: new Date().toISOString(),
            },
          }),
        });
      }
    });

    // Mock stats
    await page.route('**/api/v1/messages/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_pending: 0, sent_today: 0, failed_today: 0,
            next_scheduled: null, recent: [],
            stats: { total: 0, pending: 0, sent: 0, failed: 0, cancelled: 0, by_platform: {} },
          },
        }),
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'TestPass1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should show settings page with tabs', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Telegram Configuration')).toBeVisible();
    await expect(page.getByText('Email Configuration')).toBeVisible();
    await expect(page.getByText('SMS Configuration')).toBeVisible();
    await expect(page.getByText('WhatsApp Configuration')).toBeVisible();
    await expect(page.getByText('General Settings')).toBeVisible();
  });

  test('should switch between setting tabs', async ({ page }) => {
    await page.goto('/settings');

    // Telegram tab
    await page.getByRole('tab', { name: 'Telegram' }).click();
    await expect(page.getByText('Bot Token')).toBeVisible();

    // Email tab
    await page.getByRole('tab', { name: 'Email' }).click();
    await expect(page.getByText('Email Address')).toBeVisible();
    await expect(page.getByText('App Password')).toBeVisible();

    // SMS tab
    await page.getByRole('tab', { name: 'SMS' }).click();
    await expect(page.getByText('Account SID')).toBeVisible();

    // WhatsApp tab
    await page.getByRole('tab', { name: 'WhatsApp' }).click();
    await expect(page.getByText('WhatsApp Method')).toBeVisible();
  });

  test('should save Telegram settings', async ({ page }) => {
    await page.route('**/api/v1/settings', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Telegram settings saved' },
          }),
        });
      }
    });

    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Telegram' }).click();
    await page.fill('input[type="password"]', '123456:ABC-DEF1234ghIkl');
    await page.getByRole('button', { name: 'Save' }).click();
  });

  test('should show existing email config', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Email' }).click();
    await expect(page.getByText('test@gmail.com')).toBeVisible();
  });
});
