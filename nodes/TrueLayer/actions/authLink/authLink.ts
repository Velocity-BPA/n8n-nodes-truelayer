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
import { buildOAuthUrl } from '../../utils/authUtils';
import { generateNonce, generateState } from '../../utils/signingUtils';

export const authLinkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an authorization link for user consent',
				action: 'Create auth link',
			},
			{
				name: 'Get Configuration',
				value: 'getConfiguration',
				description: 'Get auth link configuration options',
				action: 'Get configuration',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get the status of an authorization flow',
				action: 'Get auth link status',
			},
		],
		default: 'create',
	},
];

export const authLinkFields: INodeProperties[] = [
	// Auth link type
	{
		displayName: 'Link Type',
		name: 'linkType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Data API (Account Access)',
				value: 'data',
				description: 'Authorization for account data access (AISP)',
			},
			{
				name: 'Payment Initiation',
				value: 'payment',
				description: 'Authorization for payment initiation (PISP)',
			},
		],
		default: 'data',
		description: 'Type of authorization to request',
	},
	// Scopes for Data API
	{
		displayName: 'Scopes',
		name: 'scopes',
		type: 'multiOptions',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['create'],
				linkType: ['data'],
			},
		},
		options: [
			{ name: 'Accounts', value: 'accounts' },
			{ name: 'Balance', value: 'balance' },
			{ name: 'Cards', value: 'cards' },
			{ name: 'Direct Debits', value: 'direct_debits' },
			{ name: 'Identity', value: 'info' },
			{ name: 'Offline Access', value: 'offline_access' },
			{ name: 'Standing Orders', value: 'standing_orders' },
			{ name: 'Transactions', value: 'transactions' },
		],
		default: ['accounts', 'balance', 'transactions'],
		description: 'Data API scopes to request',
	},
	// Payment ID for payment authorization
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['create'],
				linkType: ['payment'],
			},
		},
		default: '',
		description: 'Payment ID to authorize',
	},
	// Redirect URI
	{
		displayName: 'Redirect URI',
		name: 'redirectUri',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'https://your-app.com/callback',
		description: 'URI to redirect after authorization',
	},
	// Additional options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'string',
				default: '',
				description: 'Pre-select a specific bank/provider',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				description: 'Custom state parameter (auto-generated if empty)',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'string',
				default: '',
				description: 'Custom nonce parameter (auto-generated if empty)',
			},
			{
				displayName: 'Enable Mock Bank',
				name: 'enableMock',
				type: 'boolean',
				default: false,
				description: 'Whether to enable mock bank for sandbox testing',
			},
		],
	},
	// Authorization ID for status check
	{
		displayName: 'Authorization ID',
		name: 'authorizationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['getStatus'],
			},
		},
		default: '',
		description: 'The authorization or payment ID to check status',
	},
	{
		displayName: 'Status Type',
		name: 'statusType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['authLink'],
				operation: ['getStatus'],
			},
		},
		options: [
			{ name: 'Payment Authorization', value: 'payment' },
			{ name: 'Mandate Authorization', value: 'mandate' },
		],
		default: 'payment',
		description: 'Type of authorization to check',
	},
];

export async function executeAuthLinkOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let responseData: any;

	switch (operation) {
		case 'create': {
			const linkType = this.getNodeParameter('linkType', index) as string;
			const redirectUri = this.getNodeParameter('redirectUri', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				providerId?: string;
				state?: string;
				nonce?: string;
				enableMock?: boolean;
			};

			if (linkType === 'data') {
				// Data API auth link
				const credentials = await this.getCredentials('trueLayerOAuth');
				const scopes = this.getNodeParameter('scopes', index) as string[];

				const state = options.state || generateState();
				const nonce = options.nonce || generateNonce();

				const authUrl = buildOAuthUrl(credentials, {
					redirectUri,
					scopes,
					state,
					nonce,
					providerId: options.providerId,
					enableMock: options.enableMock,
				});

				responseData = {
					auth_link: authUrl,
					state,
					nonce,
					scopes,
					type: 'data_api',
				};
			} else {
				// Payment auth link
				const credentials = await this.getCredentials('trueLayerApi');
				const paymentId = this.getNodeParameter('paymentId', index) as string;
				const client = new TrueLayerClient(credentials, this);

				// Get payment authorization flow
				const authFlow = await client.get(`${ENDPOINTS.PAYMENTS}/${paymentId}/authorization-flow`);

				responseData = {
					auth_link: authFlow.authorization_flow?.configuration?.redirect?.return_uri,
					payment_id: paymentId,
					authorization_flow: authFlow,
					type: 'payment',
				};
			}
			break;
		}

		case 'getStatus': {
			const credentials = await this.getCredentials('trueLayerApi');
			const client = new TrueLayerClient(credentials, this);
			const authorizationId = this.getNodeParameter('authorizationId', index) as string;
			const statusType = this.getNodeParameter('statusType', index) as string;

			if (statusType === 'payment') {
				responseData = await client.get(`${ENDPOINTS.PAYMENTS}/${authorizationId}/authorization-flow`);
			} else {
				responseData = await client.get(`${ENDPOINTS.MANDATES}/${authorizationId}/authorization-flow`);
			}
			break;
		}

		case 'getConfiguration': {
			const credentials = await this.getCredentials('trueLayerApi');
			const client = new TrueLayerClient(credentials, this);

			// Get enabled providers and supported features
			const providers = await client.get(`${ENDPOINTS.PROVIDERS}?enabled=true`);

			responseData = {
				supported_auth_flows: ['redirect', 'embedded'],
				supported_scopes: {
					data_api: [
						'accounts',
						'balance',
						'transactions',
						'cards',
						'info',
						'direct_debits',
						'standing_orders',
						'offline_access',
					],
					payments: ['payments'],
				},
				enabled_providers_count: providers?.items?.length || 0,
				providers: providers?.items?.slice(0, 10) || [],
			};
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
