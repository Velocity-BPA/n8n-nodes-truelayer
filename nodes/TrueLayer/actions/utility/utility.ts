// @ts-nocheck
/**
 * TrueLayer Utility Resource
 * Utility operations for validation and testing
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
import { validateIBAN, formatIBAN, extractBankCodeFromIBAN, isValidSortCode, isValidAccountNumber } from '../../utils/ibanUtils';
import { ENDPOINTS } from '../../constants/endpoints';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get API Status',
				value: 'getApiStatus',
				description: 'Check TrueLayer API status',
				action: 'Get API status',
			},
			{
				name: 'Get Public Key',
				value: 'getPublicKey',
				description: 'Get TrueLayer public key for webhook verification',
				action: 'Get public key',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test API credentials and connection',
				action: 'Test connection',
			},
			{
				name: 'Validate IBAN',
				value: 'validateIban',
				description: 'Validate an IBAN number',
				action: 'Validate IBAN',
			},
			{
				name: 'Validate Sort Code',
				value: 'validateSortCode',
				description: 'Validate a UK sort code and account number',
				action: 'Validate sort code',
			},
		],
		default: 'testConnection',
	},
];

export const utilityFields: INodeProperties[] = [
	// ----------------------------------
	//         utility: validateIban
	// ----------------------------------
	{
		displayName: 'IBAN',
		name: 'iban',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateIban'],
			},
		},
		default: '',
		placeholder: 'GB82WEST12345698765432',
		description: 'The IBAN to validate',
	},

	// ----------------------------------
	//         utility: validateSortCode
	// ----------------------------------
	{
		displayName: 'Sort Code',
		name: 'sortCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateSortCode'],
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
				resource: ['utility'],
				operation: ['validateSortCode'],
			},
		},
		default: '',
		placeholder: '12345678',
		description: 'UK bank account number (8 digits)',
	},

	// ----------------------------------
	//         utility: getApiStatus
	// ----------------------------------
	{
		displayName: 'Check Options',
		name: 'checkOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getApiStatus'],
			},
		},
		options: [
			{
				displayName: 'Include Data API',
				name: 'includeDataApi',
				type: 'boolean',
				default: true,
				description: 'Whether to check Data API status',
			},
			{
				displayName: 'Include Payments API',
				name: 'includePaymentsApi',
				type: 'boolean',
				default: true,
				description: 'Whether to check Payments API status',
			},
		],
	},
];

export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'validateIban') {
		const iban = this.getNodeParameter('iban', index) as string;

		if (!iban) {
			throw new NodeOperationError(
				this.getNode(),
				'IBAN is required',
				{ itemIndex: index },
			);
		}

		const cleanIban = iban.replace(/\s/g, '').toUpperCase();
		const isValid = validateIBAN(cleanIban);

		const result: Record<string, unknown> = {
			valid: isValid,
			original: iban,
			formatted: formatIBAN(cleanIban),
		};

		if (isValid) {
			const bankCode = extractBankCodeFromIBAN(cleanIban);
			result.country_code = cleanIban.substring(0, 2);
			result.check_digits = cleanIban.substring(2, 4);
			result.bank_code = bankCode;
			result.bban = cleanIban.substring(4);
		} else {
			result.error = 'Invalid IBAN checksum or format';
		}

		returnData.push({ json: result });
	}

	if (operation === 'validateSortCode') {
		const sortCode = this.getNodeParameter('sortCode', index) as string;
		const accountNumber = this.getNodeParameter('accountNumber', index) as string;

		const cleanSortCode = sortCode.replace(/[^0-9]/g, '');
		const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '');

		const sortCodeValid = isValidSortCode(cleanSortCode);
		const accountNumberValid = isValidAccountNumber(cleanAccountNumber);

		const result: Record<string, unknown> = {
			valid: sortCodeValid && accountNumberValid,
			sort_code: {
				original: sortCode,
				formatted: cleanSortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3'),
				valid: sortCodeValid,
				error: !sortCodeValid ? 'Sort code must be exactly 6 digits' : undefined,
			},
			account_number: {
				original: accountNumber,
				formatted: cleanAccountNumber,
				valid: accountNumberValid,
				error: !accountNumberValid ? 'Account number must be exactly 8 digits' : undefined,
			},
		};

		// If both valid, generate UK IBAN (approximate - real IBAN generation requires bank-specific codes)
		if (sortCodeValid && accountNumberValid) {
			// Note: This is a simplified IBAN construction
			// Real UK IBANs require specific bank identifiers
			result.note = 'UK accounts use sort code and account number. IBAN generation requires bank-specific data.';
		}

		returnData.push({ json: result });
	}

	if (operation === 'getApiStatus') {
		const checkOptions = this.getNodeParameter('checkOptions', index, {}) as {
			includePaymentsApi?: boolean;
			includeDataApi?: boolean;
		};

		const credentials = await this.getCredentials('trueLayerApi');
		const environment = credentials.environment as string || 'sandbox';

		const status: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			environment,
			services: {},
		};

		// Check Payments API
		if (checkOptions.includePaymentsApi !== false) {
			try {
				const paymentsUrl = environment === 'production'
					? ENDPOINTS.PAYMENTS.PRODUCTION
					: ENDPOINTS.PAYMENTS.SANDBOX;

				const axios = require('axios');
				const startTime = Date.now();
				await axios.get(`${paymentsUrl}/health`, { timeout: 5000 });
				const latency = Date.now() - startTime;

				(status.services as Record<string, unknown>).payments_api = {
					status: 'operational',
					latency_ms: latency,
					url: paymentsUrl,
				};
			} catch (error) {
				(status.services as Record<string, unknown>).payments_api = {
					status: 'degraded',
					error: 'Unable to reach Payments API',
				};
			}
		}

		// Check Data API
		if (checkOptions.includeDataApi !== false) {
			try {
				const dataUrl = environment === 'production'
					? ENDPOINTS.DATA.PRODUCTION
					: ENDPOINTS.DATA.SANDBOX;

				const axios = require('axios');
				const startTime = Date.now();
				await axios.get(`${dataUrl}/health`, { timeout: 5000 });
				const latency = Date.now() - startTime;

				(status.services as Record<string, unknown>).data_api = {
					status: 'operational',
					latency_ms: latency,
					url: dataUrl,
				};
			} catch (error) {
				(status.services as Record<string, unknown>).data_api = {
					status: 'degraded',
					error: 'Unable to reach Data API',
				};
			}
		}

		// Check Auth API
		try {
			const authUrl = environment === 'production'
				? ENDPOINTS.AUTH.PRODUCTION
				: ENDPOINTS.AUTH.SANDBOX;

			const axios = require('axios');
			const startTime = Date.now();
			await axios.get(`${authUrl}/.well-known/openid-configuration`, { timeout: 5000 });
			const latency = Date.now() - startTime;

			(status.services as Record<string, unknown>).auth_api = {
				status: 'operational',
				latency_ms: latency,
				url: authUrl,
			};
		} catch (error) {
			(status.services as Record<string, unknown>).auth_api = {
				status: 'degraded',
				error: 'Unable to reach Auth API',
			};
		}

		// Overall status
		const services = status.services as Record<string, { status: string }>;
		const allOperational = Object.values(services).every(s => s.status === 'operational');
		status.overall_status = allOperational ? 'operational' : 'degraded';

		returnData.push({ json: status });
	}

	if (operation === 'testConnection') {
		const credentials = await this.getCredentials('trueLayerApi');
		const environment = credentials.environment as string || 'sandbox';

		const result: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			environment,
			tests: {},
		};

		// Test 1: Validate credentials format
		const hasClientId = !!(credentials.clientId as string);
		const hasClientSecret = !!(credentials.clientSecret as string);
		const hasSigningKey = !!(credentials.signingKeyId as string);
		const hasPrivateKey = !!(credentials.privateKey as string);

		(result.tests as Record<string, unknown>).credentials_format = {
			passed: hasClientId && hasClientSecret,
			details: {
				client_id: hasClientId ? 'present' : 'missing',
				client_secret: hasClientSecret ? 'present' : 'missing',
				signing_key_id: hasSigningKey ? 'present' : 'not configured',
				private_key: hasPrivateKey ? 'present' : 'not configured',
			},
		};

		// Test 2: Try to get access token
		try {
			const authUrl = environment === 'production'
				? ENDPOINTS.AUTH.PRODUCTION
				: ENDPOINTS.AUTH.SANDBOX;

			const axios = require('axios');
			const tokenResponse = await axios.post(
				`${authUrl}/connect/token`,
				new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: credentials.clientId as string,
					client_secret: credentials.clientSecret as string,
					scope: 'payments',
				}).toString(),
				{
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					timeout: 10000,
				},
			);

			(result.tests as Record<string, unknown>).authentication = {
				passed: true,
				token_type: tokenResponse.data.token_type,
				expires_in: tokenResponse.data.expires_in,
				scope: tokenResponse.data.scope,
			};
		} catch (error) {
			const axiosError = error as { response?: { status?: number; data?: { error?: string } }; message?: string };
			(result.tests as Record<string, unknown>).authentication = {
				passed: false,
				error: axiosError.response?.data?.error || axiosError.message,
				status_code: axiosError.response?.status,
			};
		}

		// Overall result
		const tests = result.tests as Record<string, { passed: boolean }>;
		const allPassed = Object.values(tests).every(t => t.passed);
		result.success = allPassed;
		result.message = allPassed
			? 'All connection tests passed'
			: 'Some connection tests failed. Check test details.';

		returnData.push({ json: result });
	}

	if (operation === 'getPublicKey') {
		const credentials = await this.getCredentials('trueLayerApi');
		const environment = credentials.environment as string || 'sandbox';

		try {
			const authUrl = environment === 'production'
				? ENDPOINTS.AUTH.PRODUCTION
				: ENDPOINTS.AUTH.SANDBOX;

			// Fetch JWKS from TrueLayer
			const axios = require('axios');
			const response = await axios.get(`${authUrl}/.well-known/jwks.json`, {
				timeout: 5000,
			});

			returnData.push({
				json: {
					environment,
					jwks_uri: `${authUrl}/.well-known/jwks.json`,
					keys: response.data.keys,
					note: 'These keys can be used to verify webhook signatures and JWTs from TrueLayer',
				},
			});
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Failed to fetch public keys: ${(error as Error).message}`,
				{ itemIndex: index },
			);
		}
	}

	return returnData;
}
