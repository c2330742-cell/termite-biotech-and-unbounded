import { test, expect } from '@playwright/test';

test.describe('Message Scheduling Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
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

    // Mock stats
    await page.route('**/api/v1/messages/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_pending: 0,
            sent_today: 0,
            failed_today: 0,
            next_scheduled: null,
            recent: [],
            stats: { total: 0, pending: 0, sent: 0, failed: 0, cancelled: 0, by_platform: { telegram: 0, email: 0, sms: 0, whatsapp: 0 } },
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

  test('should navigate to compose page', async ({ page }) => {
    await page.getByText('New Message').click();
    await expect(page).toHaveURL(/\/compose/);
    await expect(page.getByText('Compose Message')).toBeVisible();
  });

  test('should show platform selection cards', async ({ page }) => {
    await page.goto('/compose');
    await expect(page.getByText('Telegram')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('SMS')).toBeVisible();
    await expect(page.getByText('WhatsApp')).toBeVisible();
  });

  test('should select platform and fill compose form', async ({ page }) => {
    await page.route('**/api/v1/messages', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'msg-1',
              platform: 'email',
              recipient: 'test@example.com',
              subject: 'Test',
              body: 'Hello!',
              send_at: new Date(Date.now() + 3600000).toISOString(),
              status: 'pending',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      }
    });

    await page.goto('/compose');
    await page.fill('input[id="recipient"]', 'test@example.com');
    await page.fill('input[id="subject"]', 'Test Subject');
    await page.fill('textarea', 'Hello from Playwright!');

    // Set future date
    const futureDate = new Date(Date.now() + 86400000);
    const dateStr = futureDate.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dateStr);

    await page.getByRole('button', { name: 'Schedule Message' }).click();

    // Should redirect to queue
    await expect(page).toHaveURL(/\/queue/);
  });

  test('should show message list in queue', async ({ page }) => {
    await page.route('**/api/v1/messages?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'msg-1',
                platform: 'email',
                recipient: 'test@example.com',
                subject: null,
                body: 'Scheduled message',
                send_at: new Date(Date.now() + 3600000).toISOString(),
                status: 'pending',
                repeat_rule: 'none',
                created_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/queue');
    await expect(page.getByText('test@example.com')).toBeVisible();
    await expect(page.getByText('pending')).toBeVisible();
  });

  test('should cancel a message', async ({ page }) => {
    await page.route('**/api/v1/messages?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'msg-1',
                platform: 'email',
                recipient: 'test@example.com',
                subject: null,
                body: 'Cancel me',
                send_at: new Date(Date.now() + 3600000).toISOString(),
                status: 'pending',
                repeat_rule: 'none',
                created_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/messages/msg-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'msg-1', status: 'cancelled' },
          }),
        });
      }
    });

    await page.goto('/queue');
    await page.locator('[title="Cancel"]').click();
    await expect(page.getByText('Cancel Message')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel Message' }).click();
  });
});
