/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as crypto from 'crypto';
import { SignJWT, importPKCS8 } from 'jose';

/**
 * TrueLayer request signing configuration
 */
export interface ISigningConfig {
  keyId: string;
  privateKey: string;
  algorithm?: string;
}

/**
 * Signed request headers
 */
export interface ISignedHeaders {
  'Tl-Signature': string;
  'Idempotency-Key'?: string;
}

/**
 * Generate idempotency key for payment requests
 * TrueLayer requires idempotency keys for payment creation
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Create signature header for TrueLayer API v3
 * TrueLayer uses a custom signature format based on HTTP Signatures
 */
export async function createRequestSignature(
  config: ISigningConfig,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string,
): Promise<string> {
  const { keyId, privateKey } = config;

  // Build the signing string
  const signingHeaders = ['(request-target)', 'host', 'date'];
  if (body) {
    signingHeaders.push('content-type', 'digest');
  }

  // Calculate body digest if present
  let bodyDigest: string | undefined;
  if (body) {
    const hash = crypto.createHash('sha512').update(body).digest('base64');
    bodyDigest = `SHA-512=${hash}`;
  }

  // Build signing string
  const signingParts: string[] = [];
  for (const header of signingHeaders) {
    if (header === '(request-target)') {
      signingParts.push(`(request-target): ${method.toLowerCase()} ${path}`);
    } else if (header === 'digest' && bodyDigest) {
      signingParts.push(`digest: ${bodyDigest}`);
    } else if (headers[header]) {
      signingParts.push(`${header}: ${headers[header]}`);
    }
  }

  const signingString = signingParts.join('\n');

  // Sign the string using RS256
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingString);
  const signature = sign.sign(privateKey, 'base64');

  // Build signature header
  return [
    `keyId="${keyId}"`,
    `algorithm="rsa-sha256"`,
    `headers="${signingHeaders.join(' ')}"`,
    `signature="${signature}"`,
  ].join(',');
}

/**
 * Create JWT for TrueLayer API authentication
 * Used for client credentials flow
 */
export async function createClientAssertionJwt(
  clientId: string,
  privateKey: string,
  keyId: string,
  audience: string,
): Promise<string> {
  const key = await importPKCS8(privateKey, 'RS256');

  const jwt = await new SignJWT({
    sub: clientId,
    iss: clientId,
    aud: audience,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);

  return jwt;
}

/**
 * Sign a payment request body
 * Returns the signature and any additional headers needed
 */
export async function signPaymentRequest(
  config: ISigningConfig,
  method: string,
  path: string,
  body: object,
  idempotencyKey?: string,
): Promise<{
  headers: Record<string, string>;
  body: string;
}> {
  const bodyString = JSON.stringify(body);
  const idemKey = idempotencyKey || generateIdempotencyKey();

  // Calculate body digest
  const bodyHash = crypto.createHash('sha512').update(bodyString).digest('base64');
  const digest = `SHA-512=${bodyHash}`;

  const date = new Date().toUTCString();
  const host = 'api.truelayer.com';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Date: date,
    Host: host,
    Digest: digest,
    'Idempotency-Key': idemKey,
  };

  // Create signature
  const signature = await createRequestSignature(config, method, path, headers, bodyString);

  return {
    headers: {
      ...headers,
      'Tl-Signature': signature,
    },
    body: bodyString,
  };
}

/**
 * Verify webhook signature from TrueLayer
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string,
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Parse and validate TrueLayer signature header
 */
export function parseSignatureHeader(
  signatureHeader: string,
): {
  keyId: string;
  algorithm: string;
  headers: string[];
  signature: string;
} | null {
  try {
    const parts = signatureHeader.split(',');
    const parsed: Record<string, string> = {};

    for (const part of parts) {
      const [key, ...valueParts] = part.trim().split('=');
      const value = valueParts.join('=').replace(/^"|"$/g, '');
      parsed[key] = value;
    }

    return {
      keyId: parsed.keyId,
      algorithm: parsed.algorithm,
      headers: parsed.headers.split(' '),
      signature: parsed.signature,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a secure random string for state parameter
 */
export function generateSecureState(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate a nonce for OAuth flows
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Alias for backward compatibility
export const generateState = generateSecureState;
