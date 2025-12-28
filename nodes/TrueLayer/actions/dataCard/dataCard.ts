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

export const dataCardOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dataCard'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get card balance',
				action: 'Get card balance',
			},
			{
				name: 'Get Card',
				value: 'getCard',
				description: 'Get a specific card by ID',
				action: 'Get a card',
			},
			{
				name: 'Get Cards',
				value: 'getCards',
				description: 'Get all cards for the authorized user',
				action: 'Get all cards',
			},
			{
				name: 'Get Pending Transactions',
				value: 'getPending',
				description: 'Get pending card transactions',
				action: 'Get pending transactions',
			},
			{
				name: 'Get Transactions',
				value: 'getTransactions',
				description: 'Get card transactions',
				action: 'Get transactions',
			},
		],
		default: 'getCards',
	},
];

export const dataCardFields: INodeProperties[] = [
	// Card ID
	{
		displayName: 'Card ID',
		name: 'cardId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dataCard'],
				operation: ['getCard', 'getBalance', 'getTransactions', 'getPending'],
			},
		},
		default: '',
		description: 'The unique identifier of the card',
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
				resource: ['dataCard'],
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

export async function executeDataCardOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerOAuth');
	const client = new TrueLayerClient(credentials, this, true);

	let responseData: any;

	switch (operation) {
		case 'getCards': {
			responseData = await client.get(ENDPOINTS.DATA_CARDS);
			break;
		}

		case 'getCard': {
			const cardId = this.getNodeParameter('cardId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_CARDS}/${cardId}`);
			break;
		}

		case 'getBalance': {
			const cardId = this.getNodeParameter('cardId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_CARDS}/${cardId}/balance`);
			break;
		}

		case 'getTransactions': {
			const cardId = this.getNodeParameter('cardId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				from?: string;
				to?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.from) queryParams.append('from', options.from);
			if (options.to) queryParams.append('to', options.to);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.DATA_CARDS}/${cardId}/transactions${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'getPending': {
			const cardId = this.getNodeParameter('cardId', index) as string;
			responseData = await client.get(`${ENDPOINTS.DATA_CARDS}/${cardId}/transactions/pending`);
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
