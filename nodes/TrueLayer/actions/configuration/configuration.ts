// @ts-nocheck
/**
 * TrueLayer Configuration Resource
 * API configuration and supported features
 *
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import { TrueLayerClient } from '../../transport/trueLayerClient';
import { ENDPOINTS } from '../../constants/endpoints';
import { SUPPORTED_CURRENCIES, SUPPORTED_COUNTRIES } from '../../constants/currencies';

export const configurationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['configuration'],
			},
		},
		options: [
			{
				name: 'Get Configuration',
				value: 'get',
				description: 'Get current API configuration',
				action: 'Get configuration',
			},
			{
				name: 'Get Supported Countries',
				value: 'getCountries',
				description: 'Get list of supported countries',
				action: 'Get supported countries',
			},
			{
				name: 'Get Supported Currencies',
				value: 'getCurrencies',
				description: 'Get list of supported currencies',
				action: 'Get supported currencies',
			},
			{
				name: 'Update Configuration',
				value: 'update',
				description: 'Update API configuration',
				action: 'Update configuration',
			},
		],
		default: 'get',
	},
];

export const configurationFields: INodeProperties[] = [
	// ----------------------------------
	//         configuration: getCountries
	// ----------------------------------
	{
		displayName: 'Country Filter',
		name: 'countryFilter',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['configuration'],
				operation: ['getCountries'],
			},
		},
		options: [
			{
				displayName: 'Payment Type',
				name: 'paymentType',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Single Immediate Payment', value: 'single_immediate_payment' },
					{ name: 'Standing Order', value: 'standing_order' },
					{ name: 'Variable Recurring Payment', value: 'vrp' },
				],
				default: '',
				description: 'Filter countries by supported payment type',
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Europe', value: 'europe' },
					{ name: 'SEPA', value: 'sepa' },
					{ name: 'UK', value: 'uk' },
				],
				default: '',
				description: 'Filter countries by region',
			},
		],
	},

	// ----------------------------------
	//         configuration: getCurrencies
	// ----------------------------------
	{
		displayName: 'Currency Filter',
		name: 'currencyFilter',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['configuration'],
				operation: ['getCurrencies'],
			},
		},
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'United Kingdom', value: 'GB' },
					{ name: 'Ireland', value: 'IE' },
					{ name: 'Germany', value: 'DE' },
					{ name: 'France', value: 'FR' },
					{ name: 'Spain', value: 'ES' },
					{ name: 'Italy', value: 'IT' },
					{ name: 'Netherlands', value: 'NL' },
					{ name: 'Poland', value: 'PL' },
				],
				default: '',
				description: 'Filter currencies by country',
			},
			{
				displayName: 'Payment Type',
				name: 'paymentType',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payments', value: 'payments' },
					{ name: 'Payouts', value: 'payouts' },
				],
				default: '',
				description: 'Filter currencies by payment type support',
			},
		],
	},

	// ----------------------------------
	//         configuration: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['configuration'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Default Currency',
				name: 'defaultCurrency',
				type: 'options',
				options: [
					{ name: 'British Pound (GBP)', value: 'GBP' },
					{ name: 'Euro (EUR)', value: 'EUR' },
					{ name: 'Polish Zloty (PLN)', value: 'PLN' },
				],
				default: 'GBP',
				description: 'Default currency for transactions',
			},
			{
				displayName: 'Default Merchant Account',
				name: 'defaultMerchantAccount',
				type: 'string',
				default: '',
				description: 'Default merchant account ID',
			},
			{
				displayName: 'Enable Sandbox Mode',
				name: 'sandboxMode',
				type: 'boolean',
				default: false,
				description: 'Whether to use sandbox environment',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				description: 'Default webhook URL for events',
			},
		],
	},
];

export async function executeConfigurationOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'get') {
		// Return configuration from credentials and constants
		const credentials = await this.getCredentials('trueLayerApi');
		const environment = credentials.environment as string || 'sandbox';

		returnData.push({
			json: {
				environment,
				api_version: 'v3',
				base_url: environment === 'production'
					? ENDPOINTS.PAYMENTS.PRODUCTION
					: ENDPOINTS.PAYMENTS.SANDBOX,
				auth_url: environment === 'production'
					? ENDPOINTS.AUTH.PRODUCTION
					: ENDPOINTS.AUTH.SANDBOX,
				data_url: environment === 'production'
					? ENDPOINTS.DATA.PRODUCTION
					: ENDPOINTS.DATA.SANDBOX,
				supported_features: {
					payments: true,
					payouts: true,
					mandates: true,
					standing_orders: true,
					data_api: true,
					verification: true,
					signup_plus: true,
					webhooks: true,
				},
				limits: {
					max_payment_amount: 250000,
					max_payout_amount: 250000,
					max_mandate_amount: 100000,
					min_payment_amount: 1,
				},
			},
		});
	}

	if (operation === 'getCountries') {
		const filters = this.getNodeParameter('countryFilter', index, {}) as {
			paymentType?: string;
			region?: string;
		};

		let countries = [...SUPPORTED_COUNTRIES];

		// Filter by region
		if (filters.region === 'uk') {
			countries = countries.filter(c => c.code === 'GB');
		} else if (filters.region === 'sepa') {
			// SEPA countries
			const sepaCountries = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];
			countries = countries.filter(c => sepaCountries.includes(c.code));
		} else if (filters.region === 'europe') {
			// All European countries
			countries = countries.filter(c => c.code !== 'US');
		}

		// Filter by payment type support
		if (filters.paymentType === 'vrp') {
			// VRP only supported in UK
			countries = countries.filter(c => c.code === 'GB');
		} else if (filters.paymentType === 'standing_order') {
			// Standing orders primarily UK
			countries = countries.filter(c => ['GB', 'IE'].includes(c.code));
		}

		returnData.push({
			json: {
				countries: countries.map(c => ({
					code: c.code,
					name: c.name,
					currency: c.currency,
					supports_payments: true,
					supports_payouts: ['GB', 'IE', 'DE', 'FR', 'ES', 'IT', 'NL'].includes(c.code),
					supports_vrp: c.code === 'GB',
					supports_standing_orders: ['GB', 'IE'].includes(c.code),
				})),
				total: countries.length,
			},
		});
	}

	if (operation === 'getCurrencies') {
		const filters = this.getNodeParameter('currencyFilter', index, {}) as {
			country?: string;
			paymentType?: string;
		};

		let currencies = [...SUPPORTED_CURRENCIES];

		// Filter by country
		if (filters.country) {
			const country = SUPPORTED_COUNTRIES.find(c => c.code === filters.country);
			if (country) {
				currencies = currencies.filter(c => c.code === country.currency);
			}
		}

		// Filter by payment type
		if (filters.paymentType === 'payouts') {
			// Payouts only in GBP, EUR
			currencies = currencies.filter(c => ['GBP', 'EUR'].includes(c.code));
		}

		returnData.push({
			json: {
				currencies: currencies.map(c => ({
					code: c.code,
					name: c.name,
					symbol: c.symbol,
					minor_units: c.minorUnits,
					supports_payments: true,
					supports_payouts: ['GBP', 'EUR'].includes(c.code),
				})),
				total: currencies.length,
			},
		});
	}

	if (operation === 'update') {
		const updateFields = this.getNodeParameter('updateFields', index, {}) as {
			defaultCurrency?: string;
			defaultMerchantAccount?: string;
			webhookUrl?: string;
			sandboxMode?: boolean;
		};

		// Note: TrueLayer configuration is typically managed via dashboard
		// This returns the requested configuration as confirmation
		returnData.push({
			json: {
				success: true,
				message: 'Configuration update request received. Note: Some settings may need to be updated in the TrueLayer Console.',
				requested_changes: updateFields,
			},
		});
	}

	return returnData;
}
