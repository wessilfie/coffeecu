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
  senderPhotoUrl?: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhotoUrl?: string;
  message: string;
  senderSchool?: string;
  senderYear?: string;
  senderDegree?: string;
  senderFirstResponse?: { question: string; answer: string };
  senderClubs?: string[];
  receiverSchool?: string;
  receiverYear?: string;
  receiverDegree?: string;
  receiverFirstResponse?: { question: string; answer: string };
  receiverClubs?: string[];
  senderProfileUrl?: string;
  receiverProfileUrl?: string;
}) {
  const {
    senderName, senderEmail, senderPhotoUrl,
    receiverName, receiverEmail, receiverPhotoUrl,
    message,
    senderSchool, senderYear, senderDegree, senderFirstResponse, senderClubs,
    receiverSchool, receiverYear, receiverDegree, receiverFirstResponse, receiverClubs,
    senderProfileUrl, receiverProfileUrl,
  } = params;

  const safeMessage = message.trim().slice(0, 1000);
  const safeSenderName = senderName.slice(0, 40);
  const safeReceiverName = receiverName.slice(0, 40);
  const senderFirstName = safeSenderName.split(' ')[0];
  const receiverFirstName = safeReceiverName.split(' ')[0];

  const sMetaParts = [senderSchool, senderYear, senderDegree].filter(Boolean);
  const sMetaLine = sMetaParts.length > 0 ? sMetaParts.join(' · ') : null;

  const rMetaParts = [receiverSchool, receiverYear, receiverDegree].filter(Boolean);
  const rMetaLine = rMetaParts.length > 0 ? rMetaParts.join(' · ') : null;

  // Add clubs
  const sClubsLine = senderClubs && senderClubs.length > 0 ? senderClubs.slice(0, 2).join(', ') : '';
  const rClubsLine = receiverClubs && receiverClubs.length > 0 ? receiverClubs.slice(0, 2).join(', ') : '';

  // ── Profile Card Component ───────────────────────────────
  const renderProfileCard = (
    name: string,
    photo: string | undefined,
    meta: string | null,
    clubs: string,
    profileUrl: string | undefined
  ) => {
    const photoUrl = photo || `${APP_URL}/img/default-avatar.png`;
    const actionUrl = profileUrl || APP_URL;
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;">
        <tr>
          <td align="center" style="padding-bottom:16px;">
            <img src="${escapeHtml(photoUrl)}" width="64" height="64" style="border-radius:50%;object-fit:cover;display:block;" alt="${escapeHtml(name)}" />
            <h4 style="margin:12px 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#1A1410;">${escapeHtml(name)}</h4>
            ${meta ? `<p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#4B5563;font-weight:500;">${escapeHtml(meta)}</p>` : ''}
            ${clubs ? `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.4;">${escapeHtml(clubs)}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:16px;border-top:1px solid #E5E7EB;">
            <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:10px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#003478;background-color:#E8EEF6;border-radius:6px;text-decoration:none;">View ${escapeHtml(name.split(' ')[0])}&rsquo;s Profile</a>
          </td>
        </tr>
      </table>
    `;
  };

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
      .profile-cards-table { width: 100% !important; }
      .profile-card-stack { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-bottom: 20px !important; }
      .profile-spacer { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F9F5EE;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9F5EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #E6E0D4;border-radius:16px;box-shadow:0 12px 40px rgba(26,20,16,0.06);overflow:hidden;">
          
          <!-- Blue Header (No Logo) -->
          <tr>
            <td align="center" style="background-color:#003478;padding:32px 32px;">
              <h1 class="header-h1" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#ffffff;line-height:1;letter-spacing:-0.02em;">Coffee@CU</h1>
              <p style="margin:12px 0 0;font-family:Georgia,serif;font-size:16px;color:rgba(255,255,255,0.9);letter-spacing:0.01em;">A new connection is brewing</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="card-td" style="padding:40px 48px;">

              <h2 class="main-h2" style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1410;line-height:1.2;">
                ${escapeHtml(receiverFirstName)},
              </h2>
              <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:16px;color:#4A4540;line-height:1.5;">
                <span style="font-weight:700;color:#1A1410;">${escapeHtml(senderFirstName)}</span> sent you a request to start a conversation on Coffee@CU.
              </p>

              <!-- Chat Bubble -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:40px;">
                <tr>
                  <td width="48" valign="bottom" style="padding-right:12px;text-align:center;">
                    <img src="${escapeHtml(senderPhotoUrl || `${APP_URL}/img/default-avatar.png`)}" width="48" height="48" style="border-radius:50%;object-fit:cover;display:inline-block;" alt="${escapeHtml(senderFirstName)}" />
                  </td>
                  <td valign="top" style="background-color:#F0F7FF;border-radius:16px 16px 16px 4px;padding:24px 28px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#1A1410;line-height:1.5;">
                      ${nl2br(safeMessage)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Dual Profiles Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td width="20%"><div style="height:1px;background-color:#e5e7eb;width:100%;"></div></td>
                  <td align="center" style="padding:0 16px;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#6b7280;font-style:italic;">Here's a bit about both of you</p>
                  </td>
                  <td width="20%"><div style="height:1px;background-color:#e5e7eb;width:100%;"></div></td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="profile-cards-table" style="margin-bottom:40px;">
                <tr>
                  <!-- Receiver Profile Container -->
                  <td valign="top" width="48%" class="profile-card-stack">
                    ${renderProfileCard(receiverName, receiverPhotoUrl, rMetaLine, rClubsLine, receiverProfileUrl)}
                  </td>
                  <!-- Spacer -->
                  <td width="4%" class="profile-spacer"></td>
                  <!-- Sender Profile Container -->
                  <td valign="top" width="48%" class="profile-card-stack">
                    ${renderProfileCard(senderName, senderPhotoUrl, sMetaLine, sClubsLine, senderProfileUrl)}
                  </td>
                </tr>
              </table>

              <!-- Footer Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:32px;border-top:1px solid #F0EBE0;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#4A4540;line-height:1.6;text-align:center;">
                      You can reply directly to this email to schedule a time to meet with ${escapeHtml(senderFirstName)}.
                    </p>

                    <h3 style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1A1410;text-align:center;">
                      Here's some recommended spots:
                    </h3>
                    <p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;max-width:400px;margin-left:auto;margin-right:auto;">
                       Joe Coffee in Geffen, Peet&rsquo;s in Milstein, Brownie&rsquo;s in Avery, Carleton in Mudd, Caf&eacute; East in Lerner, Liz&rsquo;s Place in Diana, Kuro Kuma, Dear Mama, or the Hungarian Pastry Shop.
                    </p>
                    
                    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#1A1410;text-align:center;font-style:italic;font-weight:600;">
                      Wishing you a great coffee (or tea!)
                    </p>
                    <p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#6b7280;text-align:center;">
                      &mdash; The Coffee@CU Team
                    </p>

                    <div style="height:1px;background-color:#E6E0D4;width:60px;margin:0 auto 24px;"></div>
                    
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#B0A898;text-align:center;">
                      <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">What is Coffee@CU?</a> &bull; <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">coffeeatcu.com</a>
                    </p>
                  </td>
                </tr>
              </table>

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

  const text = `Hi ${safeReceiverName},

${safeSenderName} sent you a request to start a conversation on Coffee@CU:

${safeMessage}

Here's a bit about both of you:

${safeReceiverName}
${rMetaLine ? rMetaLine + '\n' : ''}${rClubsLine ? rClubsLine + '\n' : ''}${receiverProfileUrl ? `View Profile: ${receiverProfileUrl}\n` : ''}
${safeSenderName}
${sMetaLine ? sMetaLine + '\n' : ''}${sClubsLine ? sClubsLine + '\n' : ''}${senderProfileUrl ? `View Profile: ${senderProfileUrl}\n` : ''}

You can reply directly to this email to schedule a time to meet with ${safeSenderName}.
Recommended spots: Joe Coffee in Geffen, Peet's in Milstein, Brownie's in Avery, Carleton in Mudd, Cafe East in Lerner, Liz's Place in Diana, Kuro Kuma, Dear Mama, or the Hungarian Pastry Shop.

Wishing you a great coffee (or tea!)
— The Coffee@CU Team`;

  return getResend().emails.send({
    from: FROM,
    to: receiverEmail,
    replyTo: senderEmail,
    cc: senderEmail,
    subject: `Coffee @CU: ${safeSenderName} wants to chat`,
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

export async function sendVerificationEmail(params: {
  email: string;
  verificationLink: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email - Coffee@CU</title>
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #E6E0D4;border-radius:16px;box-shadow:0 12px 40px rgba(26,20,16,0.06);overflow:hidden;">
          
          <!-- Blue Header (No Logo) -->
          <tr>
            <td align="center" style="background-color:#003478;padding:32px 32px;">
              <h1 class="header-h1" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#ffffff;line-height:1;letter-spacing:-0.02em;">Coffee@CU</h1>
              <p style="margin:12px 0 0;font-family:Georgia,serif;font-size:16px;color:rgba(255,255,255,0.9);letter-spacing:0.01em;">Meet remarkable people at Columbia</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="card-td" style="padding:40px 48px;">

              <h2 class="main-h2" style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1410;line-height:1.2;">
                Hello!
              </h2>
              <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:16px;color:#4A4540;line-height:1.5;">
                Get started on Coffee@CU by confirming your email now:
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;width:100%;">
                <tr>
                  <td align="left">
                    <table cellpadding="0" cellspacing="0" border="0" style="background-color:#003478;border-radius:8px;">
                      <tr>
                        <td>
                          <a href="${params.verificationLink}" class="btn-link" 
                             style="display:inline-block;padding:16px 36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                            Confirm email &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 40px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8a8078;line-height:1.5;">
                If that link doesn't work, click this link:<br>
                <a href="${params.verificationLink}" style="color:#003478;word-break:break-all;">${params.verificationLink}</a>
              </p>

              <!-- Founder Message Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:32px;border-top:1px solid #F0EBE0;">
                <tr>
                  <td width="48" valign="top" style="padding-right:16px;">
                    <img src="https://hpgieevpapwqitlsegqg.supabase.co/storage/v1/object/public/profile-photos/profiles/5b83ec3f-19ae-4189-9585-2f89601c5120/avatar.png?t=1771944923246" 
                         width="48" height="48" style="border-radius:12px;display:block;object-fit:cover;" alt="Will" />
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:15px;color:#4A4540;line-height:1.6;font-style:italic;">
                      "I built Coffee@CU because Columbia is full of incredible people &mdash; some you've never met, some you pass every day but have never really talked to. Take a chance, meet someone new, and see what's possible."
                    </p>
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#1A1410;font-weight:600;">
                      &mdash; Will, CBS '26
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:40px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#1A1410;text-align:center;font-style:italic;font-weight:600;">
                      Make your profile in minutes and send your first coffee request. Have fun!
                    </p>
                    <p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#6b7280;text-align:center;">
                      &mdash; The Coffee@CU Team
                    </p>

                    <div style="height:1px;background-color:#E6E0D4;width:60px;margin:0 auto 24px;"></div>
                    
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#B0A898;text-align:center;">
                      Meet someone new at <a href="${APP_URL}" style="color:#003478;text-decoration:none;font-weight:600;">coffeeatcu.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hello!

Get started on Coffee@CU by confirming your email now:

Confirm email: ${params.verificationLink}

---

"I built Coffee@CU because Columbia is full of incredible people — some you've never met, some you pass every day but have never really talked to. Take a chance, meet someone new, and see what's possible."
— Will, CBS '26

Make your profile in minutes and send your first coffee request. Have fun!
— The Coffee@CU Team`;

  return getResend().emails.send({
    from: FROM,
    to: params.email,
    subject: 'Confirm your email - Coffee@CU',
    html,
    text,
  });
}
