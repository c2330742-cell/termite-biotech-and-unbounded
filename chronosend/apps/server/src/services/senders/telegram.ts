import { decrypt } from '../crypto';

interface TelegramSenderInput {
  recipient: string;
  body: string;
  credentials: {
    telegram_bot_token_enc: string | null;
  };
}

export async function sendTelegram(input: TelegramSenderInput): Promise<{ ok: boolean; error?: string }> {
  const { recipient, body, credentials } = input;

  if (!credentials.telegram_bot_token_enc) {
    return { ok: false, error: 'Telegram bot token not configured' };
  }

  let botToken: string;
  try {
    botToken = decrypt(JSON.parse(credentials.telegram_bot_token_enc));
  } catch {
    return { ok: false, error: 'Failed to decrypt Telegram bot token' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: recipient,
    text: body,
    parse_mode: 'Markdown',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const description = (errJson as Record<string, unknown>)?.description as string || res.statusText;
      return { ok: false, error: description || `Telegram API error: ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: `Telegram send failed: ${message}` };
  }
}
