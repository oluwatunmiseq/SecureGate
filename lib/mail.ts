import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    console.log('✉ [Mailer] Missing SMTP credentials in .env. Creating a temporary Ethereal test mailer account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✉ [Mailer] Ethereal account generated: User = "${testAccount.user}"`);
    } catch (err) {
      console.error('✉ [Mailer] Failed to create Ethereal test account:', err);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

const FROM_EMAIL = process.env.SMTP_FROM || 'SecureGate <noreply@localhost>';

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000'
  );
}

type EmailResult = { success: boolean };

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}): Promise<EmailResult> {
  const verifyUrl = `${getBaseUrl()}/verify-email?token=${token}`;

  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Verify your email — SecureGate',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">
            Verify your email
          </h1>
          <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
            Click the button below to verify your email address and activate your account.
            This link expires in 15 minutes.
          </p>
          <a
            href="${verifyUrl}"
            style="display: inline-block; background-color: #3548c9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;"
          >
            Verify Email
          </a>
          <p style="font-size: 14px; color: #888888; margin-top: 32px;">
            If you did not create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│  ✉ ETHEREAL TEST EMAIL (not delivered to real inbox!)       │');
      console.log('│                                                             │');
      console.log(`│  To: ${to}`);
      console.log('│  Subject: Verify your email — SecureGate');
      console.log(`│  Preview: ${previewUrl}`);
      console.log('│                                                             │');
      console.log('│  ⚠ Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env   │');
      console.log('│    to send real emails.                                     │');
      console.log('└─────────────────────────────────────────────────────────────┘');
      console.log('');
    } else {
      console.log(`✉ [Mailer] Verification email sent successfully to ${to}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[sendVerificationEmail] Failed to send email:', error);
    return { success: false };
  }
}

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}): Promise<EmailResult> {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your password — SecureGate',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">
            Reset your password
          </h1>
          <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
            Click the button below to reset your password.
            This link expires in 1 hour.
          </p>
          <a
            href="${resetUrl}"
            style="display: inline-block; background-color: #3548c9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;"
          >
            Reset Password
          </a>
          <p style="font-size: 14px; color: #888888; margin-top: 32px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│  ✉ ETHEREAL TEST EMAIL (not delivered to real inbox!)       │');
      console.log('│                                                             │');
      console.log(`│  To: ${to}`);
      console.log('│  Subject: Reset your password — SecureGate');
      console.log(`│  Preview: ${previewUrl}`);
      console.log('│                                                             │');
      console.log('│  ⚠ Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env   │');
      console.log('│    to send real emails.                                     │');
      console.log('└─────────────────────────────────────────────────────────────┘');
      console.log('');
    } else {
      console.log(`✉ [Mailer] Password reset email sent successfully to ${to}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[sendPasswordResetEmail]', error);
    return { success: false };
  }
}
