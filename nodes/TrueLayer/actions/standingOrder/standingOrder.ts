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

export const standingOrderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
			},
		},
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				description: 'Cancel a standing order',
				action: 'Cancel a standing order',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new standing order',
				action: 'Create a standing order',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a standing order by ID',
				action: 'Get a standing order',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get all standing orders',
				action: 'Get all standing orders',
			},
		],
		default: 'create',
	},
];

export const standingOrderFields: INodeProperties[] = [
	// Standing Order ID
	{
		displayName: 'Standing Order ID',
		name: 'standingOrderId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['get', 'cancel'],
			},
		},
		default: '',
		description: 'The unique identifier of the standing order',
	},
	// Create fields
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0.01,
			numberPrecision: 2,
		},
		description: 'Amount for each standing order payment',
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'GBP - British Pound', value: 'GBP' },
			{ name: 'EUR - Euro', value: 'EUR' },
		],
		default: 'GBP',
		description: 'Currency for the standing order',
	},
	{
		displayName: 'Beneficiary Name',
		name: 'beneficiaryName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the payment beneficiary',
	},
	{
		displayName: 'Reference',
		name: 'reference',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Payment reference (max 18 characters for UK)',
	},
	{
		displayName: 'Account Type',
		name: 'accountType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Sort Code & Account Number (UK)',
				value: 'sort_code_account_number',
			},
			{
				name: 'IBAN',
				value: 'iban',
			},
		],
		default: 'sort_code_account_number',
		description: 'Type of beneficiary account',
	},
	{
		displayName: 'Sort Code',
		name: 'sortCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
				accountType: ['sort_code_account_number'],
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
				resource: ['standingOrder'],
				operation: ['create'],
				accountType: ['sort_code_account_number'],
			},
		},
		default: '',
		placeholder: '12345678',
		description: 'UK bank account number (8 digits)',
	},
	{
		displayName: 'IBAN',
		name: 'iban',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
				accountType: ['iban'],
			},
		},
		default: '',
		description: 'IBAN for SEPA payments',
	},
	// Schedule fields
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Daily', value: 'daily' },
			{ name: 'Weekly', value: 'weekly' },
			{ name: 'Fortnightly', value: 'every_two_weeks' },
			{ name: 'Monthly', value: 'monthly' },
			{ name: 'Quarterly', value: 'quarterly' },
			{ name: 'Semi-Annually', value: 'semi_annually' },
			{ name: 'Annually', value: 'annually' },
		],
		default: 'monthly',
		description: 'How often to execute the standing order',
	},
	{
		displayName: 'First Payment Date',
		name: 'firstPaymentDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Date of the first payment (ISO 8601)',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['standingOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Final Payment Date',
				name: 'finalPaymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the final payment (optional)',
			},
			{
				displayName: 'Number of Payments',
				name: 'numberOfPayments',
				type: 'number',
				default: 0,
				description: 'Total number of payments to make (0 = unlimited)',
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
		],
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
				resource: ['standingOrder'],
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
		],
	},
];

export async function executeStandingOrderOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerApi');
	const client = new TrueLayerClient(credentials, this);

	let responseData: any;

	switch (operation) {
		case 'create': {
			const amount = this.getNodeParameter('amount', index) as number;
			const currency = this.getNodeParameter('currency', index) as string;
			const beneficiaryName = this.getNodeParameter('beneficiaryName', index) as string;
			const reference = this.getNodeParameter('reference', index) as string;
			const accountType = this.getNodeParameter('accountType', index) as string;
			const frequency = this.getNodeParameter('frequency', index) as string;
			const firstPaymentDate = this.getNodeParameter('firstPaymentDate', index) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

			const amountInMinor = convertToMinorUnits(amount, currency);

			// Build beneficiary based on account type
			let beneficiary: any = {
				type: 'external_account',
				account_holder_name: beneficiaryName,
			};

			if (accountType === 'sort_code_account_number') {
				const sortCode = this.getNodeParameter('sortCode', index) as string;
				const accountNumber = this.getNodeParameter('accountNumber', index) as string;
				beneficiary.account_identifier = {
					type: 'sort_code_account_number',
					sort_code: sortCode.replace(/-/g, ''),
					account_number: accountNumber,
				};
			} else {
				const iban = this.getNodeParameter('iban', index) as string;
				beneficiary.account_identifier = {
					type: 'iban',
					iban: iban.replace(/\s/g, '').toUpperCase(),
				};
			}

			const body: any = {
				amount_in_minor: amountInMinor,
				currency,
				beneficiary,
				payment_reference: reference,
				frequency,
				first_payment_date: firstPaymentDate,
			};

			if (additionalOptions.finalPaymentDate) {
				body.final_payment_date = additionalOptions.finalPaymentDate;
			}
			if (additionalOptions.numberOfPayments) {
				body.number_of_payments = additionalOptions.numberOfPayments;
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

			responseData = await client.post(ENDPOINTS.STANDING_ORDERS, body);
			break;
		}

		case 'get': {
			const standingOrderId = this.getNodeParameter('standingOrderId', index) as string;
			responseData = await client.get(`${ENDPOINTS.STANDING_ORDERS}/${standingOrderId}`);
			break;
		}

		case 'getMany': {
			const options = this.getNodeParameter('options', index, {}) as {
				cursor?: string;
				userId?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.cursor) queryParams.append('cursor', options.cursor);
			if (options.userId) queryParams.append('user_id', options.userId);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.STANDING_ORDERS}${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'cancel': {
			const standingOrderId = this.getNodeParameter('standingOrderId', index) as string;
			responseData = await client.post(
				`${ENDPOINTS.STANDING_ORDERS}/${standingOrderId}/actions/cancel`,
				{},
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
