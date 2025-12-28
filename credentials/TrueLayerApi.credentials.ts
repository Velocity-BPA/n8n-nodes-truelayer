/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * TrueLayer API Credentials
 *
 * These credentials are used for server-to-server API calls including:
 * - Payment initiation (PISP)
 * - Payouts
 * - Merchant account management
 * - Webhooks
 *
 * Note: For Data API (account information), use TrueLayer OAuth credentials
 * which requires user authorization.
 */
export class TrueLayerApi implements ICredentialType {
  name = 'trueLayerApi';
  displayName = 'TrueLayer API';
  documentationUrl = 'https://docs.truelayer.com/';
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
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
      description:
        'Your TrueLayer Client ID. Found in the TrueLayer Console under your application settings.',
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
      description: 'Your TrueLayer Client Secret. Keep this secure and never share it.',
    },
    {
      displayName: 'Signing Key ID',
      name: 'signingKeyId',
      type: 'string',
      default: '',
      description:
        'The Key ID for request signing. Required for payment operations. Found in the TrueLayer Console.',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 10,
      },
      default: '',
      description:
        'Your private key in PEM format for request signing. Required for payment operations.',
      placeholder: '-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----',
    },
    {
      displayName: 'Webhook Secret',
      name: 'webhookSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'Optional webhook signing secret for verifying webhook signatures from TrueLayer',
    },
    {
      displayName: 'Custom Auth URL',
      name: 'customAuthUrl',
      type: 'string',
      default: '',
      description: 'Override the default authentication URL (advanced use only)',
      displayOptions: {
        show: {
          environment: ['sandbox'],
        },
      },
    },
    {
      displayName: 'Custom API URL',
      name: 'customApiUrl',
      type: 'string',
      default: '',
      description: 'Override the default API URL (advanced use only)',
      displayOptions: {
        show: {
          environment: ['sandbox'],
        },
      },
    },
  ];

  // Test the credentials by attempting to get an access token
  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "production" ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com"}}',
      url: '/connect/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&client_id={{$credentials.clientId}}&client_secret={{$credentials.clientSecret}}&scope=payments',
    },
  };

  // Generic authentication adds the access token to requests
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.accessToken}}',
      },
    },
  };
}
