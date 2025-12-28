/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * TrueLayer API endpoints for different environments
 */
export const TRUELAYER_ENVIRONMENTS = {
  production: {
    name: 'Production',
    authUrl: 'https://auth.truelayer.com',
    apiUrl: 'https://api.truelayer.com',
    paymentUrl: 'https://pay-api.truelayer.com',
  },
  sandbox: {
    name: 'Sandbox',
    authUrl: 'https://auth.truelayer-sandbox.com',
    apiUrl: 'https://api.truelayer-sandbox.com',
    paymentUrl: 'https://pay-api.truelayer-sandbox.com',
  },
} as const;

/**
 * Structured endpoints for easier access
 */
export const ENDPOINTS = {
  PRODUCTION: {
    API: 'https://api.truelayer.com',
    AUTH: 'https://auth.truelayer.com',
    PAY: 'https://pay-api.truelayer.com',
  },
  SANDBOX: {
    API: 'https://api.truelayer-sandbox.com',
    AUTH: 'https://auth.truelayer-sandbox.com',
    PAY: 'https://pay-api.truelayer-sandbox.com',
  },
  // API path aliases for direct usage
  PAYMENTS: '/v3/payments',
  PAYOUTS: '/v3/payouts',
  MERCHANT_ACCOUNTS: '/v3/merchant-accounts',
  STANDING_ORDERS: '/v3/standing-orders',
  MANDATES: '/v3/mandates',
  WEBHOOKS: '/v3/webhooks',
  PROVIDERS: '/v3/providers',
  BENEFICIARIES: '/v3/beneficiaries',
  VERIFICATION: '/v3/verification',
  SIGNUP: '/v3/signup',
  REPORTING: '/v3/reporting',
  AUTH: '/connect/token',
  CONSENTS: '/v1/consents',
  DATA: '/data/v1',
} as const;

/**
 * API version paths
 */
export const API_PATHS = {
  // Payment Initiation API (v3)
  payments: '/v3/payments',
  payouts: '/v3/payouts',
  merchantAccounts: '/v3/merchant-accounts',
  standingOrders: '/v3/standing-orders',
  mandates: '/v3/mandates',

  // Data API (v1)
  dataAccounts: '/data/v1/accounts',
  dataCards: '/data/v1/cards',
  dataIdentity: '/data/v1/info',

  // Auth API
  auth: '/connect/token',
  authLink: '/v3/auth-link',

  // Utility endpoints
  providers: '/v3/providers',
  webhooks: '/v3/webhooks',
  beneficiaries: '/v3/beneficiaries',
  verification: '/v3/verification',
  signupPlus: '/v3/signup',
  reporting: '/v3/reporting',
} as const;

/**
 * OAuth scopes for TrueLayer
 */
export const OAUTH_SCOPES = {
  // Payment scopes
  paymentsCreate: 'payments',
  paymentsRead: 'payments:read',
  payoutsCreate: 'payouts',
  payoutsRead: 'payouts:read',
  standingOrdersCreate: 'standing_orders',
  standingOrdersRead: 'standing_orders:read',
  mandatesCreate: 'recurring_payments:sweeping',
  mandatesRead: 'recurring_payments:sweeping:read',

  // Data scopes
  accountsRead: 'accounts',
  balanceRead: 'balance',
  transactionsRead: 'transactions',
  cardsRead: 'cards',
  identityRead: 'info',
  directDebitsRead: 'direct_debits',
  standingOrdersDataRead: 'standing_orders',

  // Merchant scopes
  merchantAccountsRead: 'merchant_accounts',
  merchantAccountsWrite: 'merchant_accounts:write',

  // Signup+ scopes
  signupRead: 'signup:read',
  signupWrite: 'signup:write',

  // Webhook scopes
  webhooksRead: 'webhooks:read',
  webhooksWrite: 'webhooks:write',

  // Offline access
  offlineAccess: 'offline_access',
} as const;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type Environment = keyof typeof TRUELAYER_ENVIRONMENTS;
export type OAuthScope = (typeof OAUTH_SCOPES)[keyof typeof OAUTH_SCOPES];
