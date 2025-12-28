/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios from 'axios';
import { IExecuteFunctions, ILoadOptionsFunctions, IHookFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { TRUELAYER_ENVIRONMENTS, OAUTH_SCOPES } from '../constants';
import { generateSecureState, generateNonce } from '../utils/signingUtils';

/**
 * OAuth token response from TrueLayer
 */
export interface IOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * OAuth authorization parameters
 */
export interface IOAuthAuthorizationParams {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  nonce?: string;
  providerId?: string;
  enableMock?: boolean;
}

/**
 * Build OAuth authorization URL for user consent
 * This URL is used to redirect users to TrueLayer for bank authorization
 */
export function buildAuthorizationUrl(
  params: IOAuthAuthorizationParams,
  environment: 'production' | 'sandbox' = 'sandbox',
): { url: string; state: string } {
  const authUrl = TRUELAYER_ENVIRONMENTS[environment].authUrl;
  const state = params.state || generateSecureState();

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scopes.join(' '),
    state,
  });

  if (params.nonce) {
    queryParams.set('nonce', params.nonce);
  }

  if (params.providerId) {
    queryParams.set('provider_id', params.providerId);
  }

  if (params.enableMock && environment === 'sandbox') {
    queryParams.set('enable_mock', 'true');
  }

  return {
    url: `${authUrl}/?${queryParams.toString()}`,
    state,
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  environment: 'production' | 'sandbox' = 'sandbox',
): Promise<IOAuthTokenResponse> {
  const tokenUrl = `${TRUELAYER_ENVIRONMENTS[environment].authUrl}/connect/token`;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  environment: 'production' | 'sandbox' = 'sandbox',
): Promise<IOAuthTokenResponse> {
  const tokenUrl = `${TRUELAYER_ENVIRONMENTS[environment].authUrl}/connect/token`;

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

/**
 * Revoke access or refresh token
 */
export async function revokeToken(
  token: string,
  clientId: string,
  clientSecret: string,
  environment: 'production' | 'sandbox' = 'sandbox',
): Promise<void> {
  const revokeUrl = `${TRUELAYER_ENVIRONMENTS[environment].authUrl}/connect/revocation`;

  const params = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  await axios.post(revokeUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

/**
 * Get token info/introspection
 */
export async function getTokenInfo(
  token: string,
  clientId: string,
  clientSecret: string,
  environment: 'production' | 'sandbox' = 'sandbox',
): Promise<{
  active: boolean;
  scope?: string;
  client_id?: string;
  exp?: number;
}> {
  const introspectUrl = `${TRUELAYER_ENVIRONMENTS[environment].authUrl}/connect/introspect`;

  const params = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await axios.post(introspectUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

/**
 * OAuth handler for n8n execution context
 */
export class TrueLayerOAuthHandler {
  private context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;
  private clientId: string;
  private clientSecret: string;
  private environment: 'production' | 'sandbox';

  constructor(
    context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
    clientId: string,
    clientSecret: string,
    environment: 'production' | 'sandbox' = 'sandbox',
  ) {
    this.context = context;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.environment = environment;
  }

  /**
   * Create authorization URL for user consent
   */
  createAuthorizationUrl(
    redirectUri: string,
    scopes: string[],
    options?: {
      providerId?: string;
      enableMock?: boolean;
    },
  ): { url: string; state: string } {
    return buildAuthorizationUrl(
      {
        clientId: this.clientId,
        redirectUri,
        scopes,
        ...options,
      },
      this.environment,
    );
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<IOAuthTokenResponse> {
    try {
      return await exchangeCodeForToken(
        code,
        this.clientId,
        this.clientSecret,
        redirectUri,
        this.environment,
      );
    } catch (error) {
      throw new NodeOperationError(this.context.getNode(), 'Failed to exchange authorization code', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<IOAuthTokenResponse> {
    try {
      return await refreshAccessToken(
        refreshToken,
        this.clientId,
        this.clientSecret,
        this.environment,
      );
    } catch (error) {
      throw new NodeOperationError(this.context.getNode(), 'Failed to refresh access token', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Revoke token
   */
  async revoke(token: string): Promise<void> {
    try {
      await revokeToken(token, this.clientId, this.clientSecret, this.environment);
    } catch (error) {
      throw new NodeOperationError(this.context.getNode(), 'Failed to revoke token', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get token information
   */
  async introspect(
    token: string,
  ): Promise<{ active: boolean; scope?: string; exp?: number }> {
    try {
      return await getTokenInfo(token, this.clientId, this.clientSecret, this.environment);
    } catch (error) {
      throw new NodeOperationError(this.context.getNode(), 'Failed to get token info', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * Get standard Data API scopes
 */
export function getDataApiScopes(): string[] {
  return [
    OAUTH_SCOPES.accountsRead,
    OAUTH_SCOPES.balanceRead,
    OAUTH_SCOPES.transactionsRead,
    OAUTH_SCOPES.cardsRead,
    OAUTH_SCOPES.identityRead,
    OAUTH_SCOPES.directDebitsRead,
    OAUTH_SCOPES.standingOrdersDataRead,
    OAUTH_SCOPES.offlineAccess,
  ];
}

/**
 * Get minimal scopes for account information
 */
export function getMinimalAccountScopes(): string[] {
  return [OAUTH_SCOPES.accountsRead, OAUTH_SCOPES.balanceRead];
}

/**
 * Validate OAuth callback state
 */
export function validateOAuthState(receivedState: string, expectedState: string): boolean {
  return receivedState === expectedState;
}
