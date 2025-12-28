/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as crypto from 'crypto';
import { SignJWT, importPKCS8, jwtVerify, createRemoteJWKSet } from 'jose';
import { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * TrueLayer signing configuration
 */
export interface ISigningConfig {
  keyId: string;
  privateKey: string;
  algorithm?: 'RS256' | 'ES256';
}

/**
 * Signature components for TrueLayer-Signature header
 */
export interface ISignatureComponents {
  keyId: string;
  algorithm: string;
  headers: string;
  signature: string;
}

/**
 * TrueLayer Signing Handler
 * Implements request signing as required by TrueLayer Payments API v3
 */
export class TrueLayerSigningHandler {
  private config: ISigningConfig;
  private context?: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

  constructor(
    config: ISigningConfig,
    context?: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
  ) {
    this.config = config;
    this.context = context;
  }

  /**
   * Sign a payment request body
   * TrueLayer requires specific signature format for payment initiation
   */
  async signRequest(
    method: string,
    path: string,
    body: object,
    idempotencyKey: string,
  ): Promise<{
    signature: string;
    headers: Record<string, string>;
  }> {
    const bodyString = JSON.stringify(body);

    // Calculate body digest (SHA-512)
    const bodyDigest = this.calculateDigest(bodyString);

    // Build Tl-Signature
    const signature = await this.createTlSignature(method, path, bodyDigest, idempotencyKey);

    return {
      signature,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Tl-Signature': signature,
      },
    };
  }

  /**
   * Create Tl-Signature header value
   * Format follows TrueLayer's signing specification
   */
  private async createTlSignature(
    method: string,
    path: string,
    bodyDigest: string,
    idempotencyKey: string,
  ): Promise<string> {
    const { keyId, privateKey } = this.config;

    // Build JWT header
    const jwtHeader = {
      alg: 'ES512',
      kid: keyId,
      tl_version: '2',
      tl_headers: 'Idempotency-Key',
    };

    // Build signing payload
    const signingPayload = {
      method: method.toUpperCase(),
      path,
      body: bodyDigest,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    };

    try {
      // Import private key
      const key = await importPKCS8(privateKey, 'ES512');

      // Create and sign JWT
      const jwt = await new SignJWT(signingPayload)
        .setProtectedHeader(jwtHeader as any)
        .setIssuedAt()
        .sign(key);

      // Extract signature parts (header..signature, without payload for Tl-Signature)
      const parts = jwt.split('.');
      return `${parts[0]}..${parts[2]}`;
    } catch (error) {
      if (this.context) {
        throw new NodeOperationError(this.context.getNode(), 'Failed to sign request', {
          description: error instanceof Error ? error.message : 'Unknown signing error',
        });
      }
      throw error;
    }
  }

  /**
   * Calculate SHA-512 digest of body
   */
  private calculateDigest(body: string): string {
    return crypto.createHash('sha512').update(body).digest('base64');
  }

  /**
   * Create client assertion JWT for authentication
   */
  async createClientAssertion(clientId: string, audience: string): Promise<string> {
    const { keyId, privateKey } = this.config;

    try {
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
    } catch (error) {
      if (this.context) {
        throw new NodeOperationError(
          this.context.getNode(),
          'Failed to create client assertion JWT',
          {
            description: error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }
      throw error;
    }
  }

  /**
   * Generate idempotency key for payment requests
   */
  static generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate nonce for OAuth flows
   */
  static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate secure state parameter
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}

/**
 * Parse a Tl-Signature header
 */
export function parseTlSignature(tlSignature: string): {
  header: string;
  signature: string;
} | null {
  const parts = tlSignature.split('..');
  if (parts.length !== 2) {
    return null;
  }

  return {
    header: parts[0],
    signature: parts[1],
  };
}

/**
 * Create signing handler from credentials
 */
export function createSigningHandler(
  keyId: string,
  privateKey: string,
  context?: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
): TrueLayerSigningHandler {
  return new TrueLayerSigningHandler(
    {
      keyId,
      privateKey,
    },
    context,
  );
}

/**
 * Verify a signed request (for webhook verification)
 */
export async function verifySignedRequest(
  signature: string,
  body: string,
  publicKeyUrl: string,
): Promise<boolean> {
  try {
    const parsed = parseTlSignature(signature);
    if (!parsed) {
      return false;
    }

    // Reconstruct the JWT (header.payload.signature)
    const bodyDigest = crypto.createHash('sha512').update(body).digest('base64');
    const payload = Buffer.from(JSON.stringify({ body: bodyDigest })).toString('base64url');
    const jwt = `${parsed.header}.${payload}.${parsed.signature}`;

    // Verify using TrueLayer's public keys
    const JWKS = createRemoteJWKSet(new URL(publicKeyUrl));
    await jwtVerify(jwt, JWKS);

    return true;
  } catch {
    return false;
  }
}
