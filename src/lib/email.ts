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
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="padding:18px 20px;background-color:#F2F6FA;border:1px solid #D4DFEC;border-radius:8px;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#003478;text-transform:uppercase;font-weight:700;">${escapeHtml(senderFirstResponse.question.slice(0, 100))}</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#1A1410;line-height:1.6;">${nl2br(senderFirstResponse.answer.trim().slice(0, 200))}</p>
          </td>
        </tr>
      </table>`
    : '';

  const profileButtonHtml = senderProfileUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="background-color:#003478;border-radius:8px;">
            <a href="${escapeHtml(senderProfileUrl)}"
              style="display:inline-block;padding:16px 36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
              View ${escapeHtml(senderFirstName)}&rsquo;s profile &rarr;
            </a>
          </td>
        </tr>
      </table>`
    : '';

  // ── Full HTML template ───────────────────────────────────

  // ── Full HTML template ───────────────────────────────────

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coffee@CU: ${escapeHtml(safeSenderName)} wants to chat</title>
  <style>
    @media only screen and (max-width: 480px) {
      .card-td { padding: 32px 24px !important; }
      .header-h1 { font-size: 30px !important; }
      .main-h2 { font-size: 22px !important; }
      .btn-link { padding: 14px 24px !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F9F5EE;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F5EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 class="header-h1" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#1A1410;line-height:1.1;letter-spacing:-0.02em;">Coffee@CU</h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#ffffff;border:1px solid #E6E0D4;border-radius:12px;box-shadow:0 12px 40px rgba(26,20,16,0.06);overflow:hidden;">
                <tr>
                  <td style="padding:48px 40px;">

                    <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1A1410;line-height:1.3;">
                      ${escapeHtml(senderFirstName)} wants to grab coffee!
                    </h2>

                    ${metaHtml}

                    <!-- Message Block -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#FDFBF7;border-left:4px solid #003478;border-radius:0 8px 8px 0;padding:24px 28px;">
                          <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#8a8078;text-transform:uppercase;font-weight:700;">Their message</p>
                          <p style="margin:0;font-family:Georgia,serif;font-size:17px;color:#1A1410;line-height:1.7;font-style:italic;">&ldquo;${nl2br(safeMessage)}&rdquo;</p>
                        </td>
                      </tr>
                    </table>

                    ${responseHtml}

                    ${profileButtonHtml}

                    <!-- Reply context -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;padding-top:24px;border-top:1px solid #F0EBE0;">
                      <tr>
                        <td>
                          <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#4A4540;line-height:1.6;">
                            Reply directly to this email to connect with ${escapeHtml(senderFirstName)} at <a href="mailto:${escapeHtml(senderEmail)}" style="color:#003478;text-decoration:none;font-weight:600;">${escapeHtml(senderEmail)}</a>.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Info -->
          <tr>
            <td style="padding:32px 24px 0;">
              <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;color:#8a8078;line-height:1.8;text-align:center;">
                <em>Coffee spots:</em> Joe Coffee in Geffen, Peet&rsquo;s in Milstein, Brownie&rsquo;s in Avery, Carleton in Mudd, Caf&eacute; East in Lerner, Liz&rsquo;s Place in Diana, Kuro Kuma, Dear Mama, Hungarian Pastry Shop, or a walk through Morningside.
              </p>
              <div style="height:1px;background-color:#E6E0D4;width:60px;margin:0 auto 24px;"></div>
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#B0A898;line-height:1.7;text-align:center;letter-spacing:0.01em;">
                <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">What is Coffee@CU?</a> &bull; <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">coffeeatcu.com</a>
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

Some ideas for where to meet: Joe Coffee in Geffen Hall, Peet's in Milstein Center, Brownie's Café in Avery, Carleton Lounge in Mudd, Café East in Lerner, Liz's Place in the Diana Center, Kuro Kuma, Dear Mama, the Hungarian Pastry Shop on Amsterdam, or a walk through Morningside Park.

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
  const safeName = escapeHtml(params.name.slice(0, 40));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Coffee@CU</title>
  <style>
    @media only screen and (max-width: 480px) {
      .card-td { padding: 32px 24px !important; }
      .header-h1 { font-size: 30px !important; }
      .main-h2 { font-size: 22px !important; }
      .btn-link { padding: 14px 24px !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F9F5EE;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F5EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 class="header-h1" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#1A1410;line-height:1.1;letter-spacing:-0.02em;">Coffee@CU</h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#ffffff;border:1px solid #E6E0D4;border-radius:12px;box-shadow:0 12px 40px rgba(26,20,16,0.06);overflow:hidden;">
                <tr>
                  <td class="card-td" style="padding:48px 40px;">

                    <h2 class="main-h2" style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1A1410;line-height:1.3;">
                      Welcome to the community, ${safeName}!
                    </h2>

                    <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:16px;color:#4A4540;line-height:1.7;">
                      Your profile is now live on the Coffee@CU community board. Other Columbia community members can now find you and reach out for a coffee chat.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;width:100%;">
                      <tr>
                        <td align="left">
                          <table cellpadding="0" cellspacing="0" border="0" style="background-color:#003478;border-radius:8px;">
                            <tr>
                              <td>
                                <a href="${APP_URL}" class="btn-link"
                                  style="display:inline-block;padding:16px 36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                                  Browse the community &rarr;
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#8a8078;line-height:1.65;">
                      Update your profile or visibility at any time from your <a href="${APP_URL}/profile" style="color:#003478;text-decoration:none;font-weight:600;">profile page</a>.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Info -->
          <tr>
            <td style="padding:32px 24px 0;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#B0A898;line-height:1.7;text-align:center;letter-spacing:0.01em;">
                <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">What is Coffee@CU?</a> &bull; <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">coffeeatcu.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to Coffee@CU, ${params.name}!

Your profile is now live on the Coffee@CU community board. Other Columbia community members can now find you and request a coffee chat.

Browse the community: ${APP_URL}

You can update your profile at any time: ${APP_URL}/profile

One conversation at a time,
— The Coffee@CU Team`;

  return getResend().emails.send({
    from: FROM,
    to: params.email,
    subject: 'Welcome to Coffee@CU',
    html,
    text,
  });
}
