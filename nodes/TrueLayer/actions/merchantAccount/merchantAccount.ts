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

export const merchantAccountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['merchantAccount'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a merchant account by ID',
				action: 'Get a merchant account',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get merchant account balance',
				action: 'Get merchant account balance',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get all merchant accounts',
				action: 'Get all merchant accounts',
			},
			{
				name: 'Get Sweeping Settings',
				value: 'getSweeping',
				description: 'Get sweeping settings for a merchant account',
				action: 'Get sweeping settings',
			},
			{
				name: 'Get Transactions',
				value: 'getTransactions',
				description: 'Get transactions for a merchant account',
				action: 'Get merchant account transactions',
			},
			{
				name: 'Update Sweeping Settings',
				value: 'updateSweeping',
				description: 'Update sweeping settings for a merchant account',
				action: 'Update sweeping settings',
			},
		],
		default: 'getMany',
	},
];

export const merchantAccountFields: INodeProperties[] = [
	// Merchant Account ID field
	{
		displayName: 'Merchant Account ID',
		name: 'merchantAccountId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['merchantAccount'],
				operation: ['get', 'getBalance', 'getTransactions', 'getSweeping', 'updateSweeping'],
			},
		},
		default: '',
		description: 'The unique identifier of the merchant account',
	},
	// Transaction filters
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['merchantAccount'],
				operation: ['getTransactions'],
			},
		},
		options: [
			{
				displayName: 'From Date',
				name: 'from',
				type: 'dateTime',
				default: '',
				description: 'Start date for transactions (ISO 8601)',
			},
			{
				displayName: 'To Date',
				name: 'to',
				type: 'dateTime',
				default: '',
				description: 'End date for transactions (ISO 8601)',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payout', value: 'payout' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Refund', value: 'refund' },
					{ name: 'External Payment', value: 'external_payment' },
					{ name: 'Merchant Account Payment', value: 'merchant_account_payment' },
				],
				default: '',
				description: 'Filter by transaction type',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor for next page',
			},
		],
	},
	// Sweeping settings fields
	{
		displayName: 'Sweeping Enabled',
		name: 'sweepingEnabled',
		type: 'boolean',
		required: true,
		displayOptions: {
			show: {
				resource: ['merchantAccount'],
				operation: ['updateSweeping'],
			},
		},
		default: false,
		description: 'Whether to enable automatic sweeping',
	},
	{
		displayName: 'Sweeping Options',
		name: 'sweepingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['merchantAccount'],
				operation: ['updateSweeping'],
				sweepingEnabled: [true],
			},
		},
		options: [
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				options: [
					{ name: 'Daily', value: 'daily' },
					{ name: 'Weekly', value: 'weekly' },
					{ name: 'Fortnightly', value: 'fortnightly' },
					{ name: 'Monthly', value: 'monthly' },
				],
				default: 'daily',
				description: 'How often to sweep funds',
			},
			{
				displayName: 'Max Amount (Minor Units)',
				name: 'maxAmountInMinor',
				type: 'number',
				default: 0,
				description: 'Maximum amount to sweep in minor units (e.g., pence)',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{ name: 'GBP', value: 'GBP' },
					{ name: 'EUR', value: 'EUR' },
				],
				default: 'GBP',
				description: 'Currency for sweeping',
			},
		],
	},
];

export async function executeMerchantAccountOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerApi');
	const client = new TrueLayerClient(credentials, this);

	let responseData: any;

	switch (operation) {
		case 'get': {
			const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.MERCHANT_ACCOUNTS}/${merchantAccountId}`);
			break;
		}

		case 'getMany': {
			responseData = await client.get(ENDPOINTS.MERCHANT_ACCOUNTS);
			break;
		}

		case 'getBalance': {
			const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
			responseData = await client.get(
				`${ENDPOINTS.MERCHANT_ACCOUNTS}/${merchantAccountId}/balance`,
			);
			break;
		}

		case 'getTransactions': {
			const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				from?: string;
				to?: string;
				type?: string;
				cursor?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.from) queryParams.append('from', options.from);
			if (options.to) queryParams.append('to', options.to);
			if (options.type) queryParams.append('type', options.type);
			if (options.cursor) queryParams.append('cursor', options.cursor);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.MERCHANT_ACCOUNTS}/${merchantAccountId}/transactions${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'getSweeping': {
			const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
			responseData = await client.get(
				`${ENDPOINTS.MERCHANT_ACCOUNTS}/${merchantAccountId}/sweeping`,
			);
			break;
		}

		case 'updateSweeping': {
			const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
			const sweepingEnabled = this.getNodeParameter('sweepingEnabled', index) as boolean;

			const body: any = {
				enabled: sweepingEnabled,
			};

			if (sweepingEnabled) {
				const sweepingOptions = this.getNodeParameter('sweepingOptions', index, {}) as {
					frequency?: string;
					maxAmountInMinor?: number;
					currency?: string;
				};

				if (sweepingOptions.frequency) {
					body.frequency = sweepingOptions.frequency;
				}
				if (sweepingOptions.maxAmountInMinor) {
					body.max_amount_in_minor = sweepingOptions.maxAmountInMinor;
				}
				if (sweepingOptions.currency) {
					body.currency = sweepingOptions.currency;
				}
			}

			responseData = await client.post(
				`${ENDPOINTS.MERCHANT_ACCOUNTS}/${merchantAccountId}/sweeping`,
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
