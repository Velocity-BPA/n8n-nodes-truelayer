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

export const bankOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bank'],
			},
		},
		options: [
			{
				name: 'Get Capabilities',
				value: 'getCapabilities',
				description: 'Get capabilities of a specific provider',
				action: 'Get provider capabilities',
			},
			{
				name: 'Get Enabled Providers',
				value: 'getEnabled',
				description: 'Get all enabled providers for your client',
				action: 'Get enabled providers',
			},
			{
				name: 'Get Provider',
				value: 'getProvider',
				description: 'Get a specific provider by ID',
				action: 'Get a provider',
			},
			{
				name: 'Get Providers',
				value: 'getProviders',
				description: 'Get all available providers',
				action: 'Get all providers',
			},
			{
				name: 'Get Providers by Country',
				value: 'getByCountry',
				description: 'Get providers for a specific country',
				action: 'Get providers by country',
			},
			{
				name: 'Search Providers',
				value: 'search',
				description: 'Search providers by name or ID',
				action: 'Search providers',
			},
		],
		default: 'getProviders',
	},
];

export const bankFields: INodeProperties[] = [
	// Provider ID
	{
		displayName: 'Provider ID',
		name: 'providerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bank'],
				operation: ['getProvider', 'getCapabilities'],
			},
		},
		default: '',
		placeholder: 'ob-barclays',
		description: 'The unique identifier of the provider',
	},
	// Country code
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['bank'],
				operation: ['getByCountry'],
			},
		},
		options: [
			{ name: 'Austria', value: 'AT' },
			{ name: 'Belgium', value: 'BE' },
			{ name: 'Bulgaria', value: 'BG' },
			{ name: 'Czech Republic', value: 'CZ' },
			{ name: 'Denmark', value: 'DK' },
			{ name: 'Finland', value: 'FI' },
			{ name: 'France', value: 'FR' },
			{ name: 'Germany', value: 'DE' },
			{ name: 'Hungary', value: 'HU' },
			{ name: 'Ireland', value: 'IE' },
			{ name: 'Italy', value: 'IT' },
			{ name: 'Lithuania', value: 'LT' },
			{ name: 'Netherlands', value: 'NL' },
			{ name: 'Norway', value: 'NO' },
			{ name: 'Poland', value: 'PL' },
			{ name: 'Portugal', value: 'PT' },
			{ name: 'Romania', value: 'RO' },
			{ name: 'Spain', value: 'ES' },
			{ name: 'Sweden', value: 'SE' },
			{ name: 'United Kingdom', value: 'GB' },
		],
		default: 'GB',
		description: 'Country to filter providers',
	},
	// Search query
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bank'],
				operation: ['search'],
			},
		},
		default: '',
		placeholder: 'Barclays',
		description: 'Search term to find providers',
	},
	// Filter options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['bank'],
				operation: ['getProviders', 'getEnabled', 'search'],
			},
		},
		options: [
			{
				displayName: 'Auth Flow Type',
				name: 'authFlowType',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Redirect', value: 'redirect' },
					{ name: 'Embedded', value: 'embedded' },
				],
				default: '',
				description: 'Filter by authorization flow type',
			},
			{
				displayName: 'Capability',
				name: 'capability',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payments', value: 'payments' },
					{ name: 'Payouts', value: 'payouts' },
					{ name: 'Mandates (VRP)', value: 'mandates' },
					{ name: 'Standing Orders', value: 'standing_orders' },
					{ name: 'Account Data', value: 'data' },
				],
				default: '',
				description: 'Filter by capability',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'ISO country code (e.g., GB, DE, FR)',
			},
		],
	},
];

export async function executeBankOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trueLayerApi');
	const client = new TrueLayerClient(credentials, this);

	let responseData: any;

	switch (operation) {
		case 'getProviders': {
			const options = this.getNodeParameter('options', index, {}) as {
				authFlowType?: string;
				capability?: string;
				country?: string;
			};

			const queryParams = new URLSearchParams();
			if (options.authFlowType) queryParams.append('auth_flow_type', options.authFlowType);
			if (options.capability) queryParams.append('capability', options.capability);
			if (options.country) queryParams.append('country', options.country);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.PROVIDERS}${queryString ? `?${queryString}` : ''}`;
			responseData = await client.get(url);
			break;
		}

		case 'getProvider': {
			const providerId = this.getNodeParameter('providerId', index) as string;
			responseData = await client.get(`${ENDPOINTS.PROVIDERS}/${providerId}`);
			break;
		}

		case 'getByCountry': {
			const country = this.getNodeParameter('country', index) as string;
			responseData = await client.get(`${ENDPOINTS.PROVIDERS}?country=${country}`);
			break;
		}

		case 'getEnabled': {
			const options = this.getNodeParameter('options', index, {}) as {
				authFlowType?: string;
				capability?: string;
				country?: string;
			};

			const queryParams = new URLSearchParams();
			queryParams.append('enabled', 'true');
			if (options.authFlowType) queryParams.append('auth_flow_type', options.authFlowType);
			if (options.capability) queryParams.append('capability', options.capability);
			if (options.country) queryParams.append('country', options.country);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.PROVIDERS}?${queryString}`;
			responseData = await client.get(url);
			break;
		}

		case 'search': {
			const searchQuery = this.getNodeParameter('searchQuery', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				authFlowType?: string;
				capability?: string;
				country?: string;
			};

			const queryParams = new URLSearchParams();
			queryParams.append('search', searchQuery);
			if (options.authFlowType) queryParams.append('auth_flow_type', options.authFlowType);
			if (options.capability) queryParams.append('capability', options.capability);
			if (options.country) queryParams.append('country', options.country);

			const queryString = queryParams.toString();
			const url = `${ENDPOINTS.PROVIDERS}?${queryString}`;
			responseData = await client.get(url);
			break;
		}

		case 'getCapabilities': {
			const providerId = this.getNodeParameter('providerId', index) as string;
			responseData = await client.get(`${ENDPOINTS.PROVIDERS}/${providerId}/capabilities`);
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
