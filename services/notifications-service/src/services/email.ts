import sgMail from '@sendgrid/mail';
import { logNotification } from './history';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_ADDRESS = 'noreply@lastmiledr.app';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  metadata?: Record<string, string>;
}

export async function sendEmail(payload: EmailPayload) {
  const { to, subject, body, templateId, metadata } = payload;

  const msg: sgMail.MailDataRequired = {
    to,
    from: FROM_ADDRESS,
    subject,
    html: body,
    ...(templateId && { templateId }),
    ...(metadata && { customArgs: metadata }),
  };

  try {
    const [response] = await sgMail.send(msg);
    const status = response.statusCode >= 200 && response.statusCode < 300 ? 'sent' : 'failed';

    await logNotification(to, 'email', subject, status);

    return {
      success: status === 'sent',
      statusCode: response.statusCode,
      messageId: response.headers?.['x-message-id'] || null,
    };
  } catch (err) {
    await logNotification(to, 'email', subject, 'failed');
    throw err;
  }
}
