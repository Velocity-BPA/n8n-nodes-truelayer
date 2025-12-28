/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { IExecuteFunctions, ILoadOptionsFunctions, IHookFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { TRUELAYER_ENVIRONMENTS, API_PATHS } from '../constants';
import {
  ITrueLayerCredentials,
  getEnvironmentUrls,
  extractApiCredentials,
} from '../utils/authUtils';
import {
  signPaymentRequest,
  generateIdempotencyKey,
  createClientAssertionJwt,
} from '../utils/signingUtils';

// Log licensing notice once on module load
const LICENSING_NOTICE_LOGGED = Symbol.for('truelayer.licensing.logged');
if (!(global as any)[LICENSING_NOTICE_LOGGED]) {
  console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
  (global as any)[LICENSING_NOTICE_LOGGED] = true;
}

/**
 * TrueLayer API response wrapper
 */
export interface ITrueLayerResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * TrueLayer error response
 */
export interface ITrueLayerError {
  type: string;
  title: string;
  detail?: string;
  status: number;
  trace_id?: string;
  errors?: Array<{
    error_type: string;
    error_description: string;
  }>;
}

/**
 * Token cache for access tokens
 */
interface ITokenCache {
  accessToken: string;
  expiresAt: number;
}

const tokenCache: Map<string, ITokenCache> = new Map();

/**
 * TrueLayer API Client
 * Handles all API communication including authentication and request signing
 */
export class TrueLayerClient {
  private credentials: ITrueLayerCredentials;
  private urls: {
    authUrl: string;
    apiUrl: string;
    paymentUrl: string;
  };
  private axiosInstance: AxiosInstance;
  private context:
    | IExecuteFunctions
    | ILoadOptionsFunctions
    | IHookFunctions;

  constructor(
    credentials: ITrueLayerCredentials,
    context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  ) {
    this.credentials = credentials;
    this.context = context;
    this.urls = getEnvironmentUrls(credentials);

    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ITrueLayerError>) => {
        return Promise.reject(this.handleError(error));
      },
    );
  }

  /**
   * Get access token using client credentials
   */
  async getAccessToken(scopes?: string[]): Promise<string> {
    const cacheKey = `${this.credentials.clientId}:${(scopes || []).join(',')}`;
    const cached = tokenCache.get(cacheKey);

    // Return cached token if still valid (with 60s buffer)
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.accessToken;
    }

    const tokenUrl = `${this.urls.authUrl}/connect/token`;

    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');
    params.set('client_id', this.credentials.clientId);
    params.set('client_secret', this.credentials.clientSecret);

    if (scopes && scopes.length > 0) {
      params.set('scope', scopes.join(' '));
    }

    try {
      const response = await this.axiosInstance.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, expires_in } = response.data;

      // Cache the token
      tokenCache.set(cacheKey, {
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      return access_token;
    } catch (error) {
      throw new NodeOperationError(
        this.context.getNode(),
        'Failed to obtain access token from TrueLayer',
        { description: error instanceof Error ? error.message : 'Unknown error' },
      );
    }
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(
    method: string,
    path: string,
    data?: any,
    options: {
      scopes?: string[];
      baseUrl?: string;
      requiresSigning?: boolean;
      idempotencyKey?: string;
      additionalHeaders?: Record<string, string>;
    } = {},
  ): Promise<ITrueLayerResponse<T>> {
    const accessToken = await this.getAccessToken(options.scopes);
    const baseUrl = options.baseUrl || this.urls.apiUrl;
    const url = `${baseUrl}${path}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.additionalHeaders,
      },
    };

    // Handle request signing for payment APIs
    if (options.requiresSigning && this.credentials.privateKey && this.credentials.signingKeyId) {
      const signedRequest = await signPaymentRequest(
        {
          keyId: this.credentials.signingKeyId,
          privateKey: this.credentials.privateKey,
        },
        method,
        path,
        data,
        options.idempotencyKey,
      );

      config.headers = {
        ...config.headers,
        ...signedRequest.headers,
      };
      config.data = signedRequest.body;
    } else if (data) {
      config.data = data;

      // Add idempotency key for POST requests
      if (method === 'POST' && options.idempotencyKey) {
        config.headers!['Idempotency-Key'] = options.idempotencyKey;
      }
    }

    const response = await this.axiosInstance.request(config);

    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  /**
   * Make GET request
   */
  async get<T = any>(
    path: string,
    options?: {
      scopes?: string[];
      baseUrl?: string;
      params?: Record<string, any>;
    },
  ): Promise<T> {
    let fullPath = path;
    if (options?.params) {
      const queryString = new URLSearchParams(options.params).toString();
      fullPath = `${path}?${queryString}`;
    }

    const response = await this.request<T>('GET', fullPath, undefined, options);
    return response.data;
  }

  /**
   * Make POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    options?: {
      scopes?: string[];
      baseUrl?: string;
      requiresSigning?: boolean;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    const response = await this.request<T>('POST', path, data, options);
    return response.data;
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(
    path: string,
    options?: {
      scopes?: string[];
      baseUrl?: string;
    },
  ): Promise<T> {
    const response = await this.request<T>('DELETE', path, undefined, options);
    return response.data;
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(
    path: string,
    data?: any,
    options?: {
      scopes?: string[];
      baseUrl?: string;
    },
  ): Promise<T> {
    const response = await this.request<T>('PATCH', path, data, options);
    return response.data;
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError<ITrueLayerError>): Error {
    const response = error.response;

    if (!response) {
      return new NodeOperationError(this.context.getNode(), 'Network error connecting to TrueLayer', {
        description: error.message,
      });
    }

    const { status, data } = response;

    // Parse TrueLayer error format
    let errorMessage = data?.title || 'Unknown error';
    let errorDetail = data?.detail;

    if (data?.errors && data.errors.length > 0) {
      errorDetail = data.errors.map((e) => e.error_description).join(', ');
    }

    // Map status codes to descriptive messages
    const statusMessages: Record<number, string> = {
      400: 'Bad request - please check your input parameters',
      401: 'Authentication failed - check your credentials',
      403: 'Access forbidden - insufficient permissions',
      404: 'Resource not found',
      409: 'Conflict - resource already exists or state conflict',
      422: 'Validation error - invalid data provided',
      429: 'Rate limit exceeded - please slow down requests',
      500: 'TrueLayer server error',
      502: 'Bad gateway',
      503: 'Service temporarily unavailable',
    };

    const statusMessage = statusMessages[status] || `HTTP ${status} error`;

    return new NodeApiError(
      this.context.getNode(),
      {
        message: error.message,
        response: {
          status,
          data,
        },
      } as unknown as JsonObject,
      {
        message: `${statusMessage}: ${errorMessage}`,
        description: errorDetail,
        httpCode: status.toString(),
      },
    );
  }

  /**
   * Generate idempotency key
   */
  generateIdempotencyKey(): string {
    return generateIdempotencyKey();
  }
}

/**
 * Create TrueLayer client from n8n credentials
 */
export async function createTrueLayerClient(
  context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  credentialType: string = 'trueLayerApi',
): Promise<TrueLayerClient> {
  const credentials = await context.getCredentials(credentialType);
  const apiCredentials = extractApiCredentials(credentials);
  return new TrueLayerClient(apiCredentials, context);
}

/**
 * Helper to make TrueLayer API request
 */
export async function trueLayerApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: string,
  resource: string,
  body?: any,
  query?: Record<string, any>,
  options?: {
    requiresSigning?: boolean;
    idempotencyKey?: string;
  },
): Promise<any> {
  const client = await createTrueLayerClient(this);

  let path = resource;
  if (query) {
    const queryString = new URLSearchParams(query).toString();
    path = `${resource}?${queryString}`;
  }

  return client.request(method, path, body, options);
}
