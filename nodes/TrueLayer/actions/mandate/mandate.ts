// @ts-nocheck
/**
 * n8n-nodes-truelayer
 * Copyright (c) 2025 Velocity BPA
 *
 * Licensed under the Business Source License 1.1 (BSL 1.1).
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { TrueLayerClient } from '../../transport/trueLayerClient';
import { ENDPOINTS } from '../../constants/endpoints';
import { convertToMinorUnits } from '../../utils/validationUtils';

export const mandateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new VRP mandate',
				action: 'Create a mandate',
			},
			{
				name: 'Create Payment',
				value: 'createPayment',
				description: 'Create a payment using an existing mandate',
				action: 'Create payment from mandate',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a mandate by ID',
				action: 'Get a mandate',
			},
			{
				name: 'Get Authorization',
				value: 'getAuthorization',
				description: 'Get mandate authorization flow status',
				action: 'Get mandate authorization',
			},
			{
				name: 'Get Constraints',
				value: 'getConstraints',
				description: 'Get mandate constraints',
				action: 'Get mandate constraints',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get all mandates',
				action: 'Get all mandates',
			},
			{
				name: 'Revoke',
				value: 'revoke',
				description: 'Revoke an existing mandate',
				action: 'Revoke a mandate',
			},
		],
		default: 'create',
	},
];

export const mandateFields: INodeProperties[] = [
	// Mandate ID
	{
		displayName: 'Mandate ID',
		name: 'mandateId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['get', 'revoke', 'getConstraints', 'getAuthorization', 'createPayment'],
			},
		},
		default: '',
		description: 'The unique identifier of the mandate',
	},
	// Create mandate fields
	{
		displayName: 'Mandate Type',
		name: 'mandateType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Commercial VRP',
				value: 'commercial_vrp',
				description: 'Commercial Variable Recurring Payments',
			},
			{
				name: 'Sweeping VRP',
				value: 'sweeping',
				description: 'Sweeping VRP for moving funds between own accounts',
			},
		],
		default: 'commercial_vrp',
		description: 'Type of VRP mandate',
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'GBP - British Pound', value: 'GBP' },
		],
		default: 'GBP',
		description: 'Currency for the mandate (VRP is UK only)',
	},
	{
		displayName: 'Beneficiary Name',
		name: 'beneficiaryName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the payment beneficiary',
	},
	{
		displayName: 'Beneficiary Type',
		name: 'beneficiaryType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'External Account',
				value: 'external_account',
			},
			{
				name: 'Merchant Account',
				value: 'merchant_account',
			},
		],
		default: 'merchant_account',
		description: 'Type of beneficiary',
	},
	{
		displayName: 'Merchant Account ID',
		name: 'merchantAccountId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
				beneficiaryType: ['merchant_account'],
			},
		},
		default: '',
		description: 'Merchant account ID to receive payments',
	},
	{
		displayName: 'Sort Code',
		name: 'sortCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
				beneficiaryType: ['external_account'],
			},
		},
		default: '',
		placeholder: '123456',
		description: 'UK bank sort code (6 digits)',
	},
	{
		displayName: 'Account Number',
		name: 'accountNumber',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
				beneficiaryType: ['external_account'],
			},
		},
		default: '',
		placeholder: '12345678',
		description: 'UK bank account number (8 digits)',
	},
	// Constraints
	{
		displayName: 'Maximum Individual Amount',
		name: 'maxIndividualAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		default: 100,
		typeOptions: {
			minValue: 0.01,
			numberPrecision: 2,
		},
		description: 'Maximum amount per individual payment',
	},
	{
		displayName: 'Period Type',
		name: 'periodType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Week', value: 'week' },
			{ name: 'Fortnight', value: 'fortnight' },
			{ name: 'Month', value: 'month' },
			{ name: 'Half Year', value: 'half_year' },
			{ name: 'Year', value: 'year' },
		],
		default: 'month',
		description: 'Period for applying constraints',
	},
	{
		displayName: 'Period Alignment',
		name: 'periodAlignment',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Calendar', value: 'calendar' },
			{ name: 'Consent', value: 'consent' },
		],
		default: 'calendar',
		description: 'How to align the period',
	},
	{
		displayName: 'Maximum Amount Per Period',
		name: 'maxPeriodAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		default: 1000,
		typeOptions: {
			minValue: 0.01,
			numberPrecision: 2,
		},
		description: 'Maximum total amount per period',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Valid From',
				name: 'validFrom',
				type: 'dateTime',
				default: '',
				description: 'Start date for mandate validity',
			},
			{
				displayName: 'Valid To',
				name: 'validTo',
				type: 'dateTime',
				default: '',
				description: 'End date for mandate validity',
			},
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'string',
				default: '',
				description: 'Pre-select a specific bank/provider',
			},
			{
				displayName: 'Return URI',
				name: 'returnUri',
				type: 'string',
				default: '',
				description: 'URI to redirect after authorization',
			},
			{
				displayName: 'Webhook URI',
				name: 'webhookUri',
				type: 'string',
				default: '',
				description: 'URI for webhook notifications',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Reference for the mandate',
			},
		],
	},
	// Create payment from mandate fields
	{
		displayName: 'Payment Amount',
		name: 'paymentAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['createPayment'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0.01,
			numberPrecision: 2,
		},
		description: 'Amount for the payment',
	},
	{
		displayName: 'Payment Reference',
		name: 'paymentReference',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['createPayment'],
			},
		},
		default: '',
		description: 'Reference for the payment (max 18 characters)',
	},
	// Pagination options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['mandate'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor for next page',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				description: 'Filter by user ID',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Authorization Required', value: 'authorization_required' },
					{ name: 'Authorizing', value: 'authorizing' },
					{ name: 'Authorized', value: 'authorized' },
					{ name: 'Revoked', value: 'revoked' },
					{ name: 'Failed', value: 'failed' },
				],
				default: '',
				description: 'Filter by mandate status',
			},
		],
	},
];

export async function executeMandateOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerApi');
	const client = new TrueLayerClient(credentials, this);

	let responseData: any;

	switch (operation) {
		case 'create': {
			const mandateType = this.getNodeParameter('mandateType', index) as string;
			const currency = this.getNodeParameter('currency', index) as string;
			const beneficiaryName = this.getNodeParameter('beneficiaryName', index) as string;
			const beneficiaryType = this.getNodeParameter('beneficiaryType', index) as string;
			const maxIndividualAmount = this.getNodeParameter('maxIndividualAmount', index) as number;
			const periodType = this.getNodeParameter('periodType', index) as string;
			const periodAlignment = this.getNodeParameter('periodAlignment', index) as string;
			const maxPeriodAmount = this.getNodeParameter('maxPeriodAmount', index) as number;
			const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

			// Build beneficiary
			let beneficiary: any = {
				type: beneficiaryType,
				account_holder_name: beneficiaryName,
			};

			if (beneficiaryType === 'merchant_account') {
				const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
				beneficiary.merchant_account_id = merchantAccountId;
			} else {
				const sortCode = this.getNodeParameter('sortCode', index) as string;
				const accountNumber = this.getNodeParameter('accountNumber', index) as string;
				beneficiary.account_identifier = {
					type: 'sort_code_account_number',
					sort_code: sortCode.replace(/-/g, ''),
					account_number: accountNumber,
				};
			}

			const body: any = {
				type: mandateType,
				currency,
				beneficiary,
				constraints: {
					maximum_individual_amount: convertToMinorUnits(maxIndividualAmount, currency),
					periodic_limits: {
						period_type: periodType,
						period_alignment: periodAlignment,
						maximum_amount: convertToMinorUnits(maxPeriodAmount, currency),
					},
				},
			};

			if (additionalOptions.validFrom) {
				body.constraints.valid_from = additionalOptions.validFrom;
			}
			if (additionalOptions.validTo) {
				body.constraints.valid_to = additionalOptions.validTo;
			}
			if (additionalOptions.providerId) {
				body.provider_selection = {
					type: 'preselected',
					provider_id: additionalOptions.providerId,
				};
			}
			if (additionalOptions.returnUri) {
				body.return_uri = additionalOptions.returnUri;
			}
			if (additionalOptions.webhookUri) {
				body.webhook_uri = additionalOptions.webhookUri;
			}
			if (additionalOptions.reference) {
				body.reference = additionalOptions.reference;
			}

			responseData = await client.post(ENDPOINTS.MANDATES, body);
			break;
		}

		case 'get': {
			const mandateId = this.getNodeParameter('mandateId', index) as string;
			responseData = await client.get(`${ENDPOINTS.MANDATES}/${mandateId}`);
			break;
		}

		case 'getMany': {
			const options = this.getNodeParameter('options', index, {}) as {
				cursor?: string;
				userId?: string;
				status?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.cursor) queryParams.append('cursor', options.cursor);
			if (options.userId) queryParams.append('user_id', options.userId);
			if (options.status) queryParams.append('status', options.status);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.MANDATES}${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'revoke': {
			const mandateId = this.getNodeParameter('mandateId', index) as string;
			responseData = await client.post(
				`${ENDPOINTS.MANDATES}/${mandateId}/revoke`,
				{},
			);
			break;
		}

		case 'getConstraints': {
			const mandateId = this.getNodeParameter('mandateId', index) as string;
			responseData = await client.get(`${ENDPOINTS.MANDATES}/${mandateId}/constraints`);
			break;
		}

		case 'getAuthorization': {
			const mandateId = this.getNodeParameter('mandateId', index) as string;
			responseData = await client.get(`${ENDPOINTS.MANDATES}/${mandateId}/authorization-flow`);
			break;
		}

		case 'createPayment': {
			const mandateId = this.getNodeParameter('mandateId', index) as string;
			const paymentAmount = this.getNodeParameter('paymentAmount', index) as number;
			const paymentReference = this.getNodeParameter('paymentReference', index) as string;

			const body = {
				amount_in_minor: convertToMinorUnits(paymentAmount, 'GBP'),
				reference: paymentReference,
			};

			responseData = await client.post(
				`${ENDPOINTS.MANDATES}/${mandateId}/payments`,
				body,
			);
			break;
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Unknown operation: ${operation}`,
			);
	}

	return [{ json: responseData }];
}
