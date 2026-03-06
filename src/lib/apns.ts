/**
 * APNs push notification helper.
 *
 * Uses Apple's HTTP/2 token-based authentication (APNs Auth Key, not certificate).
 *
 * Required env vars:
 *   APNS_TEAM_ID       — 10-char Apple Developer Team ID
 *   APNS_KEY_ID        — 10-char key ID from the .p8 file name
 *   APNS_PRIVATE_KEY   — full content of the .p8 file (newlines as \n in env)
 *   APNS_BUNDLE_ID     — app bundle ID (default: edu.columbia.coffeeatcu)
 */

import * as http2 from 'node:http2';
import { createSign } from 'node:crypto';

// MARK: - Types

export interface APNsPushPayload {
  meetingId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
}

// MARK: - Main export

export async function sendAPNsPush(
  deviceToken: string,
  payload: APNsPushPayload,
  receiverName: string,
): Promise<void> {
  const teamId     = process.env.APNS_TEAM_ID;
  const keyId      = process.env.APNS_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const bundleId   = process.env.APNS_BUNDLE_ID ?? 'edu.columbia.coffeeatcu';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!teamId || !keyId || !privateKey) {
    console.warn('[APNs] Missing APNS_TEAM_ID / APNS_KEY_ID / APNS_PRIVATE_KEY — skipping push');
    return;
  }

  const jwt  = makeJWT(teamId, keyId, privateKey);
  const host = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

  const body = JSON.stringify({
    aps: {
      alert: {
        title: `${payload.senderName} wants to grab coffee ☕`,
        body: `Open the request to read their message and reply.`,
      },
      badge: 1,
      sound: 'default',
    },
    // Custom keys forwarded to the iOS app for deep linking
    meeting_id:   payload.meetingId,
    sender_id:    payload.senderId,
    sender_name:  payload.senderName,
    sender_email: payload.senderEmail,
  });

  return new Promise<void>((resolve, reject) => {
    const client = http2.connect(`https://${host}`);

    client.on('error', (err) => {
      client.destroy();
      reject(new Error(`[APNs] Connection error: ${err.message}`));
    });

    const req = client.request({
      ':method':       'POST',
      ':path':         `/3/device/${deviceToken}`,
      'authorization': `bearer ${jwt}`,
      'apns-topic':    bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type':  'application/json',
      'content-length': Buffer.byteLength(body),
    });

    let statusCode = 0;
    let responseBody = '';

    req.on('response', (headers) => {
      statusCode = headers[':status'] as number;
    });

    req.on('data', (chunk: Buffer) => {
      responseBody += chunk.toString();
    });

    req.on('end', () => {
      client.close();
      if (statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`[APNs] ${statusCode}: ${responseBody}`));
      }
    });

    req.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// MARK: - JWT construction (ES256 / token-based auth)

function makeJWT(teamId: string, keyId: string, privateKey: string): string {
  const header  = toBase64URL(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = toBase64URL(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));

  const unsigned = `${header}.${payload}`;
  const sign     = createSign('SHA256');
  sign.update(unsigned);

  // 'ieee-p1363' encoding produces the raw r‖s format required for ES256
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url');

  return `${unsigned}.${signature}`;
}

function toBase64URL(str: string): string {
  return Buffer.from(str).toString('base64url');
}
