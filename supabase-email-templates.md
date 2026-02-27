# Supabase Email Templates

Paste these into **Supabase Dashboard → Authentication → Email Templates**.

Each template uses Supabase's built-in variables:
- `{{ .ConfirmationURL }}` — the magic link / verification URL
- `{{ .SiteURL }}` — your site URL
- `{{ .Email }}` — the recipient's email address

---

## 1. Confirm signup (magic link / email confirmation)

**Subject line:**
```
Confirm your Coffee@CU account
```

**HTML body** (paste into the HTML editor, not the text editor):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your Coffee@CU account</title>
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
                      Confirm your email
                    </h2>

                    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:15px;color:#4a4540;line-height:1.65;">
                      You're one step away from joining the Coffee@CU community. Click the button below to verify your Columbia email address and set up your profile.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#003F8A;border-radius:4px;">
                          <a href="{{ .ConfirmationURL }}"
                            style="display:inline-block;padding:14px 32px;font-family:Georgia,serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                            Confirm my account
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;color:#8a8078;line-height:1.6;">
                      This link expires in 24 hours. If you didn't create a Coffee@CU account, you can safely ignore this email.
                    </p>

                    <!-- Fallback URL -->
                    <p style="margin:20px 0 0;font-family:'Courier New',monospace;font-size:11px;color:#b0a898;word-break:break-all;">
                      Or copy this link into your browser:<br />
                      {{ .ConfirmationURL }}
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
                <a href="{{ .SiteURL }}" style="color:#8a8078;text-decoration:underline;">coffeeatcu.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic link / passwordless sign-in

**Subject line:**
```
Your Coffee@CU sign-in link
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Coffee@CU sign-in link</title>
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
                      Here's your sign-in link
                    </h2>

                    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:15px;color:#4a4540;line-height:1.65;">
                      Click below to sign in to your Coffee@CU account. This link is single-use and expires in 1 hour.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#003F8A;border-radius:4px;">
                          <a href="{{ .ConfirmationURL }}"
                            style="display:inline-block;padding:14px 32px;font-family:Georgia,serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                            Sign in to Coffee@CU
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;color:#8a8078;line-height:1.6;">
                      If you didn't request this link, you can safely ignore this email. Your account is secure.
                    </p>

                    <!-- Fallback URL -->
                    <p style="margin:20px 0 0;font-family:'Courier New',monospace;font-size:11px;color:#b0a898;word-break:break-all;">
                      Or copy this link into your browser:<br />
                      {{ .ConfirmationURL }}
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
                <a href="{{ .SiteURL }}" style="color:#8a8078;text-decoration:underline;">coffeeatcu.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Setup checklist

1. **Resend DNS** — In Resend dashboard → Domains, add `coffeeatcu.com` and add the 3 DNS records (SPF, DKIM, DMARC) to Namecheap / Vercel DNS. Wait for green checkmarks.
2. **Supabase SMTP** — Authentication → Settings → SMTP Provider:
   - Enable custom SMTP: on
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
3. **Sender details** — Same settings page:
   - Sender name: `Coffee@CU`
   - Sender email: `noreply@coffeeatcu.com`
4. **Paste templates** — Authentication → Email Templates → paste HTML above into "Confirm signup" and "Magic link" editors.
5. **Site URL** — Authentication → URL Configuration → Site URL: `https://www.coffeeatcu.com`
6. **Redirect URLs** — Add `https://www.coffeeatcu.com/**` to the allowed redirect URLs list.
