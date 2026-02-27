import 'server-only';

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'do-not-reply@coffeeatcu.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coffeeatcu.com';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str: string): string {
  return escapeHtml(str).replace(/\n/g, '<br />');
}

// ============================================================
// Coffee request email — HTML with plain-text fallback
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

  const safeMessage = message.trim().slice(0, 1000);
  const safeSenderName = senderName.slice(0, 40);
  const safeReceiverName = receiverName.slice(0, 40);
  const senderFirstName = safeSenderName.split(' ')[0];

  const metaParts = [senderSchool, senderYear, senderDegree].filter(Boolean);
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : null;

  // ── Conditional HTML blocks ──────────────────────────────

  const metaHtml = metaLine
    ? `<p style="margin:0 0 20px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.08em;color:#8a8078;text-transform:uppercase;">${escapeHtml(metaLine)}</p>`
    : '';

  const responseHtml = senderFirstResponse
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;background-color:#eef3fa;border:1px solid #b8d4ed;border-radius:4px;">
            <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#75aadb;text-transform:uppercase;">${escapeHtml(senderFirstResponse.question.slice(0, 100))}</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#1A1410;line-height:1.6;">${nl2br(senderFirstResponse.answer.trim().slice(0, 200))}</p>
          </td>
        </tr>
      </table>`
    : '';

  const profileButtonHtml = senderProfileUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="background-color:#003F8A;border-radius:4px;">
            <a href="${escapeHtml(senderProfileUrl)}"
              style="display:inline-block;padding:12px 28px;font-family:Georgia,serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
              View ${escapeHtml(senderFirstName)}&rsquo;s profile &rarr;
            </a>
          </td>
        </tr>
      </table>`
    : '';

  // ── Full HTML template ───────────────────────────────────

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coffee@CU: ${escapeHtml(safeSenderName)} wants to chat</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F0E6;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F0E6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;color:#8a8078;text-transform:uppercase;">Columbia University</p>
              <h1 style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:600;color:#1A1410;line-height:1.1;">Coffee@CU</h1>
              <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:15px;color:#8a8078;font-style:italic;">Meet the Columbia community, one coffee at a time.</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#ffffff;border:1px solid #ddd8cc;border-radius:6px;box-shadow:0 4px 24px rgba(26,20,16,0.08);">
                <tr>
                  <td style="padding:40px 36px;">

                    <!-- Top accent bar -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="height:3px;background:linear-gradient(90deg,#003F8A,#0d5eac);border-radius:2px;"></td>
                      </tr>
                    </table>

                    <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1A1410;">
                      ${escapeHtml(senderFirstName)} wants to grab coffee with you!
                    </h2>

                    ${metaHtml}

                    <!-- Message block -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background-color:#f9f5ee;border-left:3px solid #003F8A;border-radius:0 4px 4px 0;padding:16px 20px;">
                          <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#8a8078;text-transform:uppercase;">Their message</p>
                          <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#1A1410;line-height:1.65;font-style:italic;">&ldquo;${nl2br(safeMessage)}&rdquo;</p>
                        </td>
                      </tr>
                    </table>

                    ${responseHtml}

                    ${profileButtonHtml}

                    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:14px;color:#4a4540;line-height:1.65;">
                      Reply directly to this email to connect with ${escapeHtml(senderFirstName)} at ${escapeHtml(senderEmail)}.
                    </p>

                    <!-- Coffee spots -->
                    <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#8a8078;line-height:1.75;border-top:1px solid #ede9e0;padding-top:20px;">
                      <em>Some places to meet:</em> Joe Coffee in Geffen Hall, Peet&rsquo;s in Milstein Center, Brownie&rsquo;s Caf&eacute; in Avery, Carleton Lounge in Mudd, Caf&eacute; East in Lerner, Liz&rsquo;s Place in the Diana Center, the Hungarian Pastry Shop on Amsterdam, or a walk through Morningside Park.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#b0a898;line-height:1.7;">
                Coffee@CU is open to @columbia.edu and @barnard.edu addresses only.<br />
                <a href="${APP_URL}" style="color:#8a8078;text-decoration:underline;">coffeeatcu.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ── Plain-text fallback ──────────────────────────────────

  const safeAnswer = senderFirstResponse?.answer?.trim().slice(0, 200);
  let aboutSection = '';
  if (metaLine || safeAnswer || senderProfileUrl) {
    aboutSection += `\nAbout ${safeSenderName}:\n`;
    if (metaLine) aboutSection += `${metaLine}\n`;
    if (safeAnswer) aboutSection += `"${safeAnswer}"\n`;
    if (senderProfileUrl) aboutSection += `\nView their profile: ${senderProfileUrl}\n`;
  }

  const text = `Hi ${safeReceiverName},

${safeSenderName} wants to grab coffee with you!
${aboutSection}
Their message:
"${safeMessage}"

Reply directly to this email to reach ${safeSenderName} at ${senderEmail}.

Some ideas for where to meet: Joe Coffee in Geffen Hall, Peet's in Milstein Center, Brownie's Café in Avery, Carleton Lounge in Mudd, Café East in Lerner, Liz's Place in the Diana Center, the Hungarian Pastry Shop on Amsterdam, or a walk through Morningside Park.

Have a great conversation!

— The Coffee@CU Team
${APP_URL}`;

  return getResend().emails.send({
    from: FROM,
    to: receiverEmail,
    replyTo: senderEmail,
    cc: senderEmail,
    subject: `Coffee@CU: ${safeSenderName} wants to chat`,
    html,
    text,
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
