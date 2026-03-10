import twilio from 'twilio';
import { logNotification } from './history';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

interface SmsPayload {
  to: string;
  body: string;
}

export async function sendSms(payload: SmsPayload) {
  const { to, body } = payload;

  try {
    const message = await client.messages.create({
      to,
      from: FROM_NUMBER,
      body,
    });

    const status = message.status === 'failed' || message.status === 'undelivered' ? 'failed' : 'sent';
    await logNotification(to, 'sms', body.substring(0, 100), status);

    return {
      success: status === 'sent',
      sid: message.sid,
      status: message.status,
    };
  } catch (err) {
    await logNotification(to, 'sms', body.substring(0, 100), 'failed');
    throw err;
  }
}
