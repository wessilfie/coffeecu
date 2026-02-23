import 'server-only';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'do-not-reply@coffeecu.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coffeecu.com';

// ============================================================
// Email helpers — all plain-text to avoid HTML injection
// ============================================================

export async function sendCoffeeRequestEmail(params: {
  senderName: string;
  senderEmail: string;
  receiverName: string;
  receiverEmail: string;
  message: string;
}) {
  const { senderName, senderEmail, receiverName, receiverEmail, message } = params;

  // Escape user content — plain-text email, no HTML injection risk
  const safeMessage = message.trim().slice(0, 1000);
  const safeSenderName = senderName.slice(0, 40);
  const safeReceiverName = receiverName.slice(0, 40);

  const body = `Hi ${safeReceiverName},

${safeSenderName} would like to chat with you over coffee!

Their message:
"${safeMessage}"

Reply directly to this email to reach ${safeSenderName} at ${senderEmail}.

Some great places to meet at Columbia: Joe Coffee in NoCo or the Journalism building, Peet's in the Milstein Center, Carleton Lounge in Mudd, Café East in Lerner, Hungarian Pastry Shop on Amsterdam, Liz's Place in the Diana Center, or Brownie's Café in Avery.

Have a great conversation!

— The Coffee@CU Team
${APP_URL}`;

  return resend.emails.send({
    from: FROM,
    to: receiverEmail,
    replyTo: senderEmail,
    cc: senderEmail,
    subject: `Coffee@CU: ${safeSenderName} wants to chat`,
    text: body,
  });
}

export async function sendWelcomeEmail(params: {
  name: string;
  email: string;
}) {
  const body = `Welcome to Coffee@CU, ${params.name}!

Your profile is now live on the Coffee@CU community board. Other Columbia community members can now find you and request a coffee chat.

Visit ${APP_URL} to browse other members or update your profile.

One conversation at a time,
— The Coffee@CU Team`;

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: 'Welcome to Coffee@CU',
    text: body,
  });
}
