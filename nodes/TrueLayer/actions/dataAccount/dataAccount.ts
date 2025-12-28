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

export const dataAccountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dataAccount'],
			},
		},
		options: [
			{
				name: 'Get Account',
				value: 'getAccount',
				description: 'Get a specific account by ID',
				action: 'Get an account',
			},
			{
				name: 'Get Accounts',
				value: 'getAccounts',
				description: 'Get all accounts for the authorized user',
				action: 'Get all accounts',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get account balance',
				action: 'Get account balance',
			},
			{
				name: 'Get Direct Debits',
				value: 'getDirectDebits',
				description: 'Get direct debits for an account',
				action: 'Get direct debits',
			},
			{
				name: 'Get Pending Transactions',
				value: 'getPending',
				description: 'Get pending transactions for an account',
				action: 'Get pending transactions',
			},
			{
				name: 'Get Standing Orders',
				value: 'getStandingOrders',
				description: 'Get standing orders for an account',
				action: 'Get standing orders',
			},
			{
				name: 'Get Transactions',
				value: 'getTransactions',
				description: 'Get transactions for an account',
				action: 'Get transactions',
			},
		],
		default: 'getAccounts',
	},
];

export const dataAccountFields: INodeProperties[] = [
	// Account ID
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dataAccount'],
				operation: ['getAccount', 'getBalance', 'getTransactions', 'getPending', 'getStandingOrders', 'getDirectDebits'],
			},
		},
		default: '',
		description: 'The unique identifier of the account',
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
				resource: ['dataAccount'],
				operation: ['getTransactions', 'getPending'],
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
		],
	},
];

export async function executeDataAccountOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerOAuth');
	const client = new TrueLayerClient(credentials, this, true);

	let responseData: any;

	switch (operation) {
		case 'getAccounts': {
			responseData = await client.get(ENDPOINTS.DATA_ACCOUNTS);
			break;
		}

		case 'getAccount': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_ACCOUNTS}/${accountId}`);
			break;
		}

		case 'getBalance': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_ACCOUNTS}/${accountId}/balance`);
			break;
		}

		case 'getTransactions': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				from?: string;
				to?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.from) queryParams.append('from', options.from);
			if (options.to) queryParams.append('to', options.to);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.DATA_ACCOUNTS}/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'getPending': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_ACCOUNTS}/${accountId}/transactions/pending`);
			break;
		}

		case 'getStandingOrders': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_ACCOUNTS}/${accountId}/standing-orders`);
			break;
		}

		case 'getDirectDebits': {
			const accountId = this.getNodeParameter('accountId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_ACCOUNTS}/${accountId}/direct-debits`);
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
