import nodemailer from 'nodemailer';
import { decrypt } from '../crypto';
import { EMAIL_SUBJECT_DEFAULT, DEFAULT_SMTP_HOST, DEFAULT_SMTP_PORT } from '@chronosend/shared';

interface EmailSenderInput {
  recipient: string;
  subject?: string;
  body: string;
  credentials: {
    email_address: string | null;
    email_app_password_enc: string | null;
    smtp_host?: string | null;
    smtp_port?: number | null;
    smtp_secure?: boolean | null;
  };
}

export async function sendEmail(input: EmailSenderInput): Promise<{ ok: boolean; error?: string }> {
  const { recipient, body, credentials } = input;

  if (!credentials.email_address || !credentials.email_app_password_enc) {
    return { ok: false, error: 'Email credentials not configured' };
  }

  let appPassword: string;
  try {
    appPassword = decrypt(JSON.parse(credentials.email_app_password_enc));
  } catch {
    return { ok: false, error: 'Failed to decrypt email app password' };
  }

  const smtpHost = credentials.smtp_host || DEFAULT_SMTP_HOST;
  const smtpPort = credentials.smtp_port || DEFAULT_SMTP_PORT;
  const smtpSecure = credentials.smtp_secure ?? smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: credentials.email_address,
      pass: appPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: credentials.email_address,
      to: recipient,
      subject: input.subject || EMAIL_SUBJECT_DEFAULT,
      text: body,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Email send failed: ${(err as Error).message}` };
  }
}
