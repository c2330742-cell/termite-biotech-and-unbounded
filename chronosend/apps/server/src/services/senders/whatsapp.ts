import twilio from 'twilio';
import { decrypt } from '../crypto';

interface WhatsAppSenderInput {
  recipient: string;
  body: string;
  credentials: {
    twilio_account_sid_enc: string | null;
    twilio_auth_token_enc: string | null;
    twilio_whatsapp_number: string | null;
    twilio_phone_number: string | null;
    whatsapp_method: string;
  };
}

export async function sendWhatsApp(input: WhatsAppSenderInput): Promise<{ ok: boolean; error?: string }> {
  const { recipient, body, credentials } = input;

  if (credentials.whatsapp_method === 'baileys') {
    // Local Baileys bridge — POST to http://localhost:3000/send
    try {
      const res = await fetch('http://localhost:3000/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: recipient, message: body }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { ok: false, error: `Baileys bridge error: ${err}` };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: `WhatsApp (Baileys) send failed: ${(err as Error).message}` };
    }
  }

  // Twilio WhatsApp
  if (!credentials.twilio_account_sid_enc || !credentials.twilio_auth_token_enc) {
    return { ok: false, error: 'Twilio credentials not configured for WhatsApp' };
  }

  const fromNumber = credentials.twilio_whatsapp_number || credentials.twilio_phone_number;
  if (!fromNumber) {
    return { ok: false, error: 'WhatsApp sender number not configured' };
  }

  let accountSid: string;
  let authToken: string;
  try {
    accountSid = decrypt(JSON.parse(credentials.twilio_account_sid_enc));
    authToken = decrypt(JSON.parse(credentials.twilio_auth_token_enc));
  } catch {
    return { ok: false, error: 'Failed to decrypt Twilio credentials' };
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${recipient}`,
      body,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `WhatsApp (Twilio) send failed: ${(err as Error).message}` };
  }
}
