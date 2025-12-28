/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createTrueLayerClient } from '../../transport';
import { API_PATHS, CURRENCY_OPTIONS } from '../../constants';
import { toMinorUnits, validateAmount, validateCurrency } from '../../utils';

/**
 * Payout operations - for sending money from merchant account to external accounts
 */
export const payoutOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['payout'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new payout from merchant account',
        action: 'Create a payout',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get payout details by ID',
        action: 'Get a payout',
      },
      {
        name: 'Get Status',
        value: 'getStatus',
        description: 'Get current payout status',
        action: 'Get payout status',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        description: 'Get multiple payouts',
        action: 'Get many payouts',
      },
    ],
    default: 'create',
  },
];

/**
 * Payout operation fields
 */
export const payoutFields: INodeProperties[] = [
  // Create Payout Fields
  {
    displayName: 'Merchant Account ID',
    name: 'merchantAccountId',
    type: 'string',
    default: '',
    required: true,
    description: 'The merchant account to send funds from',
    displayOptions: {
      show: {
        resource: ['payout'],
        operation: ['create'],
      },
    },
  },
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
    description: 'Payout amount in major units',
    displayOptions: {
      show: {
        resource: ['payout'],
        operation: ['create'],
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
    description: 'Payout currency',
    displayOptions: {
      show: {
        resource: ['payout'],
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
    description: 'Name of the payout recipient',
    displayOptions: {
      show: {
        resource: ['payout'],
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
    ],
    default: 'sort_code_account_number',
    description: 'Type of beneficiary account',
    displayOptions: {
      show: {
        resource: ['payout'],
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
    description: 'UK sort code',
    displayOptions: {
      show: {
        resource: ['payout'],
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
    description: 'UK account number',
    displayOptions: {
      show: {
        resource: ['payout'],
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
        resource: ['payout'],
        operation: ['create'],
        accountType: ['iban'],
      },
    },
  },
  {
    displayName: 'Reference',
    name: 'reference',
    type: 'string',
    default: '',
    description: 'Payout reference for bank statement',
    displayOptions: {
      show: {
        resource: ['payout'],
        operation: ['create'],
      },
    },
  },

  // Payout ID for get operations
  {
    displayName: 'Payout ID',
    name: 'payoutId',
    type: 'string',
    default: '',
    required: true,
    description: 'The unique identifier of the payout',
    displayOptions: {
      show: {
        resource: ['payout'],
        operation: ['get', 'getStatus'],
      },
    },
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
        resource: ['payout'],
        operation: ['getMany'],
      },
    },
  },
  {
    displayName: 'Cursor',
    name: 'cursor',
    type: 'string',
    default: '',
    description: 'Pagination cursor',
    displayOptions: {
      show: {
        resource: ['payout'],
        operation: ['getMany'],
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
        resource: ['payout'],
        operation: ['create'],
      },
    },
    options: [
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
        description: 'Payment scheme to use',
      },
      {
        displayName: 'Metadata',
        name: 'metadata',
        type: 'json',
        default: '{}',
        description: 'Custom metadata',
      },
    ],
  },
];

/**
 * Execute payout operations
 */
export async function executePayoutOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const client = await createTrueLayerClient(this);
  let responseData: any;

  switch (operation) {
    case 'create': {
      const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
      const amount = this.getNodeParameter('amount', index) as number;
      const currency = this.getNodeParameter('currency', index) as string;
      const beneficiaryName = this.getNodeParameter('beneficiaryName', index) as string;
      const accountType = this.getNodeParameter('accountType', index) as string;
      const reference = this.getNodeParameter('reference', index, '') as string;
      const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

      // Validate
      const amountValidation = validateAmount(amount);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.errors.join(', '));
      }

      const currencyValidation = validateCurrency(currency);
      if (!currencyValidation.isValid) {
        throw new Error(currencyValidation.errors.join(', '));
      }

      // Build account identifier
      let accountIdentifier: any;
      if (accountType === 'sort_code_account_number') {
        const sortCode = this.getNodeParameter('sortCode', index) as string;
        const accountNumber = this.getNodeParameter('accountNumber', index) as string;
        accountIdentifier = {
          type: 'sort_code_account_number',
          sort_code: sortCode.replace(/-/g, ''),
          account_number: accountNumber,
        };
      } else {
        const iban = this.getNodeParameter('iban', index) as string;
        accountIdentifier = {
          type: 'iban',
          iban: iban.replace(/\s/g, '').toUpperCase(),
        };
      }

      const payoutBody: any = {
        merchant_account_id: merchantAccountId,
        amount_in_minor: toMinorUnits(amount, currency),
        currency,
        beneficiary: {
          type: 'external_account',
          account_holder_name: beneficiaryName,
          account_identifier: accountIdentifier,
          reference: reference || undefined,
        },
      };

      if (additionalOptions.schemeType) {
        payoutBody.scheme_id = additionalOptions.schemeType;
      }

      if (additionalOptions.metadata) {
        try {
          payoutBody.metadata = JSON.parse(additionalOptions.metadata);
        } catch {
          // Ignore invalid JSON
        }
      }

      responseData = await client.post(API_PATHS.payouts, payoutBody, {
        requiresSigning: true,
        idempotencyKey: client.generateIdempotencyKey(),
        scopes: ['payouts'],
      });
      break;
    }

    case 'get': {
      const payoutId = this.getNodeParameter('payoutId', index) as string;
      responseData = await client.get(`${API_PATHS.payouts}/${payoutId}`, {
        scopes: ['payouts'],
      });
      break;
    }

    case 'getStatus': {
      const payoutId = this.getNodeParameter('payoutId', index) as string;
      const payout = await client.get(`${API_PATHS.payouts}/${payoutId}`, {
        scopes: ['payouts'],
      });
      responseData = {
        id: payout.id,
        status: payout.status,
        created_at: payout.created_at,
      };
      break;
    }

    case 'getMany': {
      const limit = this.getNodeParameter('limit', index, 50) as number;
      const cursor = this.getNodeParameter('cursor', index, '') as string;
      const params: any = { limit };
      if (cursor) params.cursor = cursor;

      responseData = await client.get(API_PATHS.payouts, {
        params,
        scopes: ['payouts'],
      });
      break;
    }
  }

  return [{ json: responseData }];
}
