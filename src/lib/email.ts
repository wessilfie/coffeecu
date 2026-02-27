import 'server-only';

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'do-not-reply@coffeeatcu.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coffeeatcu.com';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

// ============================================================
// Email helpers — all plain-text to avoid HTML injection
// ============================================================

export async function sendCoffeeRequestEmail(params: {
  senderName: string;
  senderEmail: string;
  receiverName: string;
  receiverEmail: string;
  message: string;
  senderSchool?: string;
  senderYear?: string;
  senderDegree?: string;
  senderFirstResponse?: { question: string; answer: string };
  senderProfileUrl?: string;
}) {
  const {
    senderName, senderEmail, receiverName, receiverEmail, message,
    senderSchool, senderYear, senderDegree, senderFirstResponse, senderProfileUrl,
  } = params;

  // Escape user content — plain-text email, no HTML injection risk
  const safeMessage = message.trim().slice(0, 1000);
  const safeSenderName = senderName.slice(0, 40);
  const safeReceiverName = receiverName.slice(0, 40);

  // Build "About [Sender]" section
  const metaParts = [senderSchool, senderYear, senderDegree].filter(Boolean);
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : null;
  const safeAnswer = senderFirstResponse?.answer?.trim().slice(0, 200);
  let aboutSection = '';
  if (metaLine || safeAnswer || senderProfileUrl) {
    aboutSection += `\nAbout ${safeSenderName}:\n`;
    if (metaLine) aboutSection += `${metaLine}\n`;
    if (safeAnswer) aboutSection += `"${safeAnswer}"\n`;
    if (senderProfileUrl) aboutSection += `\nView their profile: ${senderProfileUrl}\n`;
  }

  const body = `Hi ${safeReceiverName},

${safeSenderName} would like to chat with you over coffee!
${aboutSection}
Their message:
"${safeMessage}"

Reply directly to this email to reach ${safeSenderName} at ${senderEmail}.

Some ideas for where to meet: Joe Coffee in Geffen Hall on the Manhattanville campus, Peet's in the Milstein Center, Brownie's Café in Avery, Carleton Lounge in Mudd, Café East in Lerner, Liz's Place in the Diana Center, the Hungarian Pastry Shop on Amsterdam, or a walk through Morningside Park.

Have a great conversation!

— The Coffee@CU Team
${APP_URL}`;

  return getResend().emails.send({
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

  return getResend().emails.send({
    from: FROM,
    to: params.email,
    subject: 'Welcome to Coffee@CU',
    text: body,
  });
}
