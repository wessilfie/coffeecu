import 'server-only';

export async function sendCoffeeRequestSMS(params: {
  toPhone: string;
  receiverName: string;
  senderName: string;
  senderSchool?: string | null;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return; // SMS not configured
  }

  const { default: twilio } = await import('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const firstName = params.receiverName.split(' ')[0];
  const context = params.senderSchool ? ` (${params.senderSchool})` : '';
  const body =
    `Hi ${firstName} — ${params.senderName}${context} sent you a Coffee@CU request. ` +
    `Check your email to reply or visit coffeeatcu.com`;

  return client.messages.create({
    body,
    from: process.env.TWILIO_FROM_NUMBER!,
    to: params.toPhone,
  });
}
