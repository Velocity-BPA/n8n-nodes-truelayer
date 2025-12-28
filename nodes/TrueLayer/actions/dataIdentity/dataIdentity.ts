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

export const dataIdentityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dataIdentity'],
			},
		},
		options: [
			{
				name: 'Get Identity',
				value: 'getIdentity',
				description: 'Get identity information for the authorized user',
				action: 'Get identity',
			},
			{
				name: 'Get Identity with Accounts',
				value: 'getIdentityWithAccounts',
				description: 'Get identity with linked account information',
				action: 'Get identity with accounts',
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get general user information',
				action: 'Get info',
			},
		],
		default: 'getIdentity',
	},
];

export const dataIdentityFields: INodeProperties[] = [];

export async function executeDataIdentityOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerOAuth');
	const client = new TrueLayerClient(credentials, this, true);

	let responseData: any;

	switch (operation) {
		case 'getIdentity': {
			responseData = await client.get(ENDPOINTS.DATA_IDENTITY);
			break;
		}

		case 'getIdentityWithAccounts': {
			// Get identity and accounts in parallel
			const [identity, accounts] = await Promise.all([
				client.get(ENDPOINTS.DATA_IDENTITY),
				client.get(ENDPOINTS.DATA_ACCOUNTS),
			]);
			responseData = {
				identity,
				accounts,
			};
			break;
		}

		case 'getInfo': {
			responseData = await client.get(ENDPOINTS.DATA_INFO);
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
