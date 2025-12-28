/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createTrueLayerClient } from '../../transport';
import { API_PATHS, CURRENCY_OPTIONS, COUNTRY_OPTIONS, SCHEME_TYPES } from '../../constants';
import { validatePaymentRequest, toMinorUnits } from '../../utils';

/**
 * Payment resource description for n8n
 */
export const paymentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['payment'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new payment initiation',
        action: 'Create a payment',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get payment details by ID',
        action: 'Get a payment',
      },
      {
        name: 'Get Status',
        value: 'getStatus',
        description: 'Get current payment status',
        action: 'Get payment status',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'Get multiple payments',
        action: 'Get many payments',
      },
      {
        name: 'Cancel',
        value: 'cancel',
        description: 'Cancel a pending payment',
        action: 'Cancel a payment',
      },
      {
        name: 'Create Refund',
        value: 'createRefund',
        description: 'Create a refund for a settled payment',
        action: 'Create a refund',
      },
      {
        name: 'Get Refund',
        value: 'getRefund',
        description: 'Get refund details',
        action: 'Get a refund',
      },
      {
        name: 'Get Refunds',
        value: 'getRefunds',
        description: 'Get all refunds for a payment',
        action: 'Get payment refunds',
      },
      {
        name: 'Get Authorization Flow',
        value: 'getAuthFlow',
        description: 'Get current authorization flow state',
        action: 'Get authorization flow',
      },
      {
        name: 'Start Authorization',
        value: 'startAuth',
        description: 'Start the payment authorization process',
        action: 'Start authorization',
      },
      {
        name: 'Get Provider Selection',
        value: 'getProviderSelection',
        description: 'Get available providers for payment',
        action: 'Get provider selection',
      },
    ],
    default: 'create',
  },
];

/**
 * Payment create operation fields
 */
export const paymentFields: INodeProperties[] = [
  // Create Payment Fields
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    typeOptions: {
      numberPrecision: 2,
      minValue: 0.01,
    },
    default: 0,
    required: true,
    description: 'Payment amount in major units (e.g., 10.50 for £10.50)',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create', 'createRefund'],
      },
    },
  },
  {
    displayName: 'Currency',
    name: 'currency',
    type: 'options',
    options: CURRENCY_OPTIONS as any,
    default: 'GBP',
    required: true,
    description: 'Payment currency (ISO 4217)',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Beneficiary Name',
    name: 'beneficiaryName',
    type: 'string',
    default: '',
    required: true,
    description: 'Name of the payment beneficiary (recipient)',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Payment Reference',
    name: 'reference',
    type: 'string',
    default: '',
    required: true,
    description:
      'Payment reference visible on bank statements. Max 18 chars for UK, 140 for SEPA.',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Account Type',
    name: 'accountType',
    type: 'options',
    options: [
      { name: 'Sort Code & Account Number (UK)', value: 'sort_code_account_number' },
      { name: 'IBAN', value: 'iban' },
      { name: 'Merchant Account', value: 'merchant_account' },
    ],
    default: 'sort_code_account_number',
    description: 'Type of beneficiary account identifier',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Sort Code',
    name: 'sortCode',
    type: 'string',
    default: '',
    placeholder: '04-00-04',
    description: 'UK sort code (6 digits, with or without hyphens)',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
        accountType: ['sort_code_account_number'],
      },
    },
  },
  {
    displayName: 'Account Number',
    name: 'accountNumber',
    type: 'string',
    default: '',
    placeholder: '12345678',
    description: 'UK account number (8 digits)',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
        accountType: ['sort_code_account_number'],
      },
    },
  },
  {
    displayName: 'IBAN',
    name: 'iban',
    type: 'string',
    default: '',
    placeholder: 'GB82WEST12345698765432',
    description: 'International Bank Account Number',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
        accountType: ['iban'],
      },
    },
  },
  {
    displayName: 'Merchant Account ID',
    name: 'merchantAccountId',
    type: 'string',
    default: '',
    description: 'TrueLayer merchant account ID for receiving payments',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
        accountType: ['merchant_account'],
      },
    },
  },

  // Payment ID field for get/update/delete operations
  {
    displayName: 'Payment ID',
    name: 'paymentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The unique identifier of the payment',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: [
          'get',
          'getStatus',
          'cancel',
          'createRefund',
          'getRefunds',
          'getAuthFlow',
          'startAuth',
          'getProviderSelection',
        ],
      },
    },
  },
  {
    displayName: 'Refund ID',
    name: 'refundId',
    type: 'string',
    default: '',
    required: true,
    description: 'The unique identifier of the refund',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['getRefund'],
      },
    },
  },

  // Additional Options
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Payer Name',
        name: 'payerName',
        type: 'string',
        default: '',
        description: 'Name of the person making the payment',
      },
      {
        displayName: 'Payer Email',
        name: 'payerEmail',
        type: 'string',
        default: '',
        description: 'Email address of the payer for notifications',
      },
      {
        displayName: 'Return URI',
        name: 'returnUri',
        type: 'string',
        default: '',
        description: 'URL to redirect user after payment authorization',
      },
      {
        displayName: 'Webhook URI',
        name: 'webhookUri',
        type: 'string',
        default: '',
        description: 'URL for payment status webhook notifications',
      },
      {
        displayName: 'Provider ID',
        name: 'providerId',
        type: 'string',
        default: '',
        description: 'Pre-select a specific bank provider',
      },
      {
        displayName: 'Scheme Type',
        name: 'schemeType',
        type: 'options',
        options: [
          { name: 'Faster Payments (UK)', value: 'faster_payments_service' },
          { name: 'SEPA Credit Transfer', value: 'sepa_credit_transfer' },
          { name: 'SEPA Instant', value: 'sepa_credit_transfer_instant' },
        ],
        default: 'faster_payments_service',
        description: 'Payment scheme/rail to use',
      },
      {
        displayName: 'Metadata',
        name: 'metadata',
        type: 'json',
        default: '{}',
        description: 'Custom metadata to attach to the payment',
      },
    ],
  },

  // Pagination for getMany
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['getMany'],
      },
    },
  },
  {
    displayName: 'Cursor',
    name: 'cursor',
    type: 'string',
    default: '',
    description: 'Pagination cursor from previous response',
    displayOptions: {
      show: {
        resource: ['payment'],
        operation: ['getMany'],
      },
    },
  },
];

/**
 * Execute payment operations
 */
export async function executePaymentOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const client = await createTrueLayerClient(this);
  let responseData: any;

  switch (operation) {
    case 'create': {
      const amount = this.getNodeParameter('amount', index) as number;
      const currency = this.getNodeParameter('currency', index) as string;
      const beneficiaryName = this.getNodeParameter('beneficiaryName', index) as string;
      const reference = this.getNodeParameter('reference', index) as string;
      const accountType = this.getNodeParameter('accountType', index) as string;
      const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

      // Validate payment parameters
      const validation = validatePaymentRequest({
        amount,
        currency,
        beneficiaryName,
        reference,
      });

      if (!validation.isValid) {
        throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
      }

      // Build beneficiary account object
      let beneficiaryAccount: any;
      if (accountType === 'sort_code_account_number') {
        const sortCode = this.getNodeParameter('sortCode', index) as string;
        const accountNumber = this.getNodeParameter('accountNumber', index) as string;
        beneficiaryAccount = {
          type: 'sort_code_account_number',
          sort_code: sortCode.replace(/-/g, ''),
          account_number: accountNumber,
        };
      } else if (accountType === 'iban') {
        const iban = this.getNodeParameter('iban', index) as string;
        beneficiaryAccount = {
          type: 'iban',
          iban: iban.replace(/\s/g, '').toUpperCase(),
        };
      } else if (accountType === 'merchant_account') {
        const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
        beneficiaryAccount = {
          type: 'merchant_account',
          merchant_account_id: merchantAccountId,
        };
      }

      // Build payment request body
      const paymentBody: any = {
        amount_in_minor: toMinorUnits(amount, currency),
        currency,
        payment_method: {
          type: 'bank_transfer',
          provider_selection: {
            type: 'user_selected',
          },
          beneficiary: {
            type: 'external_account',
            account_holder_name: beneficiaryName,
            account_identifier: beneficiaryAccount,
            reference,
          },
        },
      };

      // Add optional fields
      if (additionalOptions.payerName || additionalOptions.payerEmail) {
        paymentBody.user = {
          name: additionalOptions.payerName,
          email: additionalOptions.payerEmail,
        };
      }

      if (additionalOptions.returnUri) {
        paymentBody.payment_method.provider_selection.return_uri = additionalOptions.returnUri;
      }

      if (additionalOptions.providerId) {
        paymentBody.payment_method.provider_selection = {
          type: 'preselected',
          provider_id: additionalOptions.providerId,
        };
      }

      if (additionalOptions.schemeType) {
        paymentBody.payment_method.provider_selection.scheme_id = additionalOptions.schemeType;
      }

      if (additionalOptions.metadata) {
        try {
          paymentBody.metadata = JSON.parse(additionalOptions.metadata);
        } catch {
          // Ignore invalid JSON
        }
      }

      responseData = await client.post(`${API_PATHS.payments}`, paymentBody, {
        requiresSigning: true,
        idempotencyKey: client.generateIdempotencyKey(),
        scopes: ['payments'],
      });
      break;
    }

    case 'get': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.get(`${API_PATHS.payments}/${paymentId}`, {
        scopes: ['payments'],
      });
      break;
    }

    case 'getStatus': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.get(`${API_PATHS.payments}/${paymentId}`, {
        scopes: ['payments'],
      });
      // Extract just the status information
      responseData = {
        id: responseData.id,
        status: responseData.status,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
      break;
    }

    case 'getMany': {
      const limit = this.getNodeParameter('limit', index, 50) as number;
      const cursor = this.getNodeParameter('cursor', index, '') as string;
      const params: any = { limit };
      if (cursor) params.cursor = cursor;

      responseData = await client.get(API_PATHS.payments, {
        params,
        scopes: ['payments'],
      });
      break;
    }

    case 'cancel': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.post(
        `${API_PATHS.payments}/${paymentId}/actions/cancel`,
        {},
        {
          scopes: ['payments'],
        },
      );
      break;
    }

    case 'createRefund': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      const amount = this.getNodeParameter('amount', index) as number;

      // Get original payment to determine currency
      const payment = await client.get(`${API_PATHS.payments}/${paymentId}`, {
        scopes: ['payments'],
      });

      const refundBody = {
        amount_in_minor: toMinorUnits(amount, payment.currency),
      };

      responseData = await client.post(`${API_PATHS.payments}/${paymentId}/refunds`, refundBody, {
        requiresSigning: true,
        idempotencyKey: client.generateIdempotencyKey(),
        scopes: ['payments'],
      });
      break;
    }

    case 'getRefund': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      const refundId = this.getNodeParameter('refundId', index) as string;
      responseData = await client.get(`${API_PATHS.payments}/${paymentId}/refunds/${refundId}`, {
        scopes: ['payments'],
      });
      break;
    }

    case 'getRefunds': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.get(`${API_PATHS.payments}/${paymentId}/refunds`, {
        scopes: ['payments'],
      });
      break;
    }

    case 'getAuthFlow': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.get(`${API_PATHS.payments}/${paymentId}/authorization-flow`, {
        scopes: ['payments'],
      });
      break;
    }

    case 'startAuth': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.post(
        `${API_PATHS.payments}/${paymentId}/authorization-flow`,
        {},
        {
          scopes: ['payments'],
        },
      );
      break;
    }

    case 'getProviderSelection': {
      const paymentId = this.getNodeParameter('paymentId', index) as string;
      responseData = await client.get(
        `${API_PATHS.payments}/${paymentId}/authorization-flow/actions/provider-selection`,
        {
          scopes: ['payments'],
        },
      );
      break;
    }
  }

  return [{ json: responseData }];
}
