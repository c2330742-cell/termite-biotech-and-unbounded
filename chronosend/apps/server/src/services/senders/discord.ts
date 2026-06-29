import { decrypt } from '../crypto';

interface DiscordSenderInput {
  recipient: string;
  body: string;
  credentials: {
    discord_bot_token_enc: string | null;
  };
}

export async function sendDiscord(input: DiscordSenderInput): Promise<{ ok: boolean; error?: string }> {
  const { recipient, body, credentials } = input;

  if (!credentials.discord_bot_token_enc) {
    return { ok: false, error: 'Discord bot token not configured' };
  }

  let botToken: string;
  try {
    botToken = decrypt(JSON.parse(credentials.discord_bot_token_enc));
  } catch {
    return { ok: false, error: 'Failed to decrypt Discord bot token' };
  }

  // Determine if recipient is a channel ID (snowflake) or a webhook URL
  const isWebhook = recipient.startsWith('http://') || recipient.startsWith('https://');

  try {
    if (isWebhook) {
      // Send via webhook
      const res = await fetch(recipient, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return { ok: false, error: `Discord webhook error (${res.status}): ${errText || res.statusText}` };
      }

      return { ok: true };
    }

    // Send via bot — POST to channel
    const res = await fetch(`https://discord.com/api/v10/channels/${recipient}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify({ content: body }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const message = (errJson as Record<string, unknown>)?.message as string || res.statusText;
      return { ok: false, error: message || `Discord API error: ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: `Discord send failed: ${message}` };
  }
}
