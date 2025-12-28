/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { TRUELAYER_ENVIRONMENTS, OAUTH_SCOPES } from '../constants';
import type { Environment } from '../constants/endpoints';

/**
 * TrueLayer API credentials interface
 */
export interface ITrueLayerCredentials {
  environment: Environment;
  clientId: string;
  clientSecret: string;
  signingKeyId?: string;
  privateKey?: string;
  webhookSecret?: string;
  customAuthUrl?: string;
  customApiUrl?: string;
}

/**
 * TrueLayer OAuth credentials interface
 */
export interface ITrueLayerOAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

/**
 * Token response from TrueLayer OAuth
 */
export interface ITokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Get environment URLs from credentials
 */
export function getEnvironmentUrls(credentials: ITrueLayerCredentials): {
  authUrl: string;
  apiUrl: string;
  paymentUrl: string;
} {
  const environment = credentials.environment || 'sandbox';

  if (environment === 'production') {
    return {
      authUrl: credentials.customAuthUrl || TRUELAYER_ENVIRONMENTS.production.authUrl,
      apiUrl: credentials.customApiUrl || TRUELAYER_ENVIRONMENTS.production.apiUrl,
      paymentUrl: TRUELAYER_ENVIRONMENTS.production.paymentUrl,
    };
  }

  return {
    authUrl: credentials.customAuthUrl || TRUELAYER_ENVIRONMENTS.sandbox.authUrl,
    apiUrl: credentials.customApiUrl || TRUELAYER_ENVIRONMENTS.sandbox.apiUrl,
    paymentUrl: TRUELAYER_ENVIRONMENTS.sandbox.paymentUrl,
  };
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthorizationUrl(
  credentials: ITrueLayerOAuthCredentials,
  state: string,
  nonce?: string,
): string {
  const environment = 'sandbox'; // Default to sandbox for OAuth
  const authUrl = TRUELAYER_ENVIRONMENTS[environment].authUrl;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    scope: credentials.scope,
    state,
  });

  if (nonce) {
    params.set('nonce', nonce);
  }

  return `${authUrl}/?${params.toString()}`;
}

/**
 * Parse scopes string into array
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString.split(/[\s,]+/).filter((s) => s.length > 0);
}

/**
 * Validate required scopes for an operation
 */
export function validateScopes(requiredScopes: string[], availableScopes: string[]): boolean {
  return requiredScopes.every((scope) => availableScopes.includes(scope));
}

/**
 * Get default scopes for different operations
 */
export function getDefaultScopes(operation: string): string[] {
  const scopeMap: Record<string, string[]> = {
    payments: [OAUTH_SCOPES.paymentsCreate, OAUTH_SCOPES.paymentsRead],
    payouts: [OAUTH_SCOPES.payoutsCreate, OAUTH_SCOPES.payoutsRead],
    accounts: [OAUTH_SCOPES.accountsRead, OAUTH_SCOPES.balanceRead, OAUTH_SCOPES.transactionsRead],
    mandates: [OAUTH_SCOPES.mandatesCreate, OAUTH_SCOPES.mandatesRead],
    merchantAccounts: [OAUTH_SCOPES.merchantAccountsRead, OAUTH_SCOPES.merchantAccountsWrite],
    webhooks: [OAUTH_SCOPES.webhooksRead, OAUTH_SCOPES.webhooksWrite],
  };

  return scopeMap[operation] || [];
}

/**
 * Extract credentials from n8n credential object
 */
export function extractApiCredentials(
  credentials: ICredentialDataDecryptedObject,
): ITrueLayerCredentials {
  return {
    environment: (credentials.environment as Environment) || 'sandbox',
    clientId: credentials.clientId as string,
    clientSecret: credentials.clientSecret as string,
    signingKeyId: credentials.signingKeyId as string | undefined,
    privateKey: credentials.privateKey as string | undefined,
    webhookSecret: credentials.webhookSecret as string | undefined,
    customAuthUrl: credentials.customAuthUrl as string | undefined,
    customApiUrl: credentials.customApiUrl as string | undefined,
  };
}

/**
 * Mask sensitive credential data for logging
 */
export function maskCredentials(credentials: ITrueLayerCredentials): Record<string, string> {
  return {
    environment: credentials.environment,
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'not set',
    clientSecret: credentials.clientSecret ? '****' : 'not set',
    signingKeyId: credentials.signingKeyId
      ? `${credentials.signingKeyId.substring(0, 8)}...`
      : 'not set',
    privateKey: credentials.privateKey ? '****' : 'not set',
    webhookSecret: credentials.webhookSecret ? '****' : 'not set',
  };
}

/**
 * Build OAuth authorization URL
 */
export function buildOAuthUrl(
  credentials: ITrueLayerCredentials,
  redirectUri: string,
  scope: string,
  state: string,
  providerId?: string,
): string {
  const urls = getEnvironmentUrls(credentials);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
  });

  if (providerId) {
    params.append('provider_id', providerId);
  }

  return `${urls.authUrl}/?${params.toString()}`;
}
