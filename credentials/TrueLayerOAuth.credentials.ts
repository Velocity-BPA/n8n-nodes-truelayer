/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * TrueLayer OAuth Credentials
 *
 * These credentials are used for user-authorized Data API access including:
 * - Account Information (AISP)
 * - Transaction history
 * - Identity information
 * - Card data
 *
 * OAuth flow requires user consent to access their banking data.
 * The refresh token allows long-term access without re-authorization.
 */
export class TrueLayerOAuth implements ICredentialType {
  name = 'trueLayerOAuth';
  displayName = 'TrueLayer OAuth';
  documentationUrl = 'https://docs.truelayer.com/';
  extends = ['oAuth2Api'];
  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Sandbox',
          value: 'sandbox',
          description: 'Use TrueLayer sandbox for testing',
        },
        {
          name: 'Production',
          value: 'production',
          description: 'Use TrueLayer production environment',
        },
      ],
      default: 'sandbox',
      description: 'The TrueLayer environment to connect to',
    },
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default:
        '={{$self.environment === "production" ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com"}}',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default:
        '={{$self.environment === "production" ? "https://auth.truelayer.com/connect/token" : "https://auth.truelayer-sandbox.com/connect/token"}}',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
      description: 'Your TrueLayer Client ID from the TrueLayer Console',
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your TrueLayer Client Secret',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'string',
      default: 'info accounts balance transactions cards direct_debits standing_orders offline_access',
      description:
        'Space-separated list of scopes. Available: info, accounts, balance, transactions, cards, direct_debits, standing_orders, offline_access',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
      description: 'Send client credentials in the body (TrueLayer requirement)',
    },
    {
      displayName: 'Provider ID',
      name: 'providerId',
      type: 'string',
      default: '',
      description:
        'Optional: Pre-select a specific bank provider. Leave empty to show provider selection.',
    },
    {
      displayName: 'Enable Mock Bank',
      name: 'enableMock',
      type: 'boolean',
      default: true,
      description:
        'Whether to show mock bank option in sandbox environment for testing',
      displayOptions: {
        show: {
          environment: ['sandbox'],
        },
      },
    },
  ];
}
