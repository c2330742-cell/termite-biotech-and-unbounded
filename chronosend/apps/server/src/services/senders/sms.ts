import twilio from 'twilio';
import { decrypt } from '../crypto';

interface SmsSenderInput {
  recipient: string;
  body: string;
  credentials: {
    twilio_account_sid_enc: string | null;
    twilio_auth_token_enc: string | null;
    twilio_phone_number: string | null;
  };
}

export async function sendSms(input: SmsSenderInput): Promise<{ ok: boolean; error?: string }> {
  const { recipient, body, credentials } = input;

  if (!credentials.twilio_account_sid_enc || !credentials.twilio_auth_token_enc || !credentials.twilio_phone_number) {
    return { ok: false, error: 'Twilio SMS credentials not fully configured' };
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
      from: credentials.twilio_phone_number,
      to: recipient,
      body,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `SMS send failed: ${(err as Error).message}` };
  }
}
