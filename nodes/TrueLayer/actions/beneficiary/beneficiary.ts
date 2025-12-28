// @ts-nocheck
/**
 * TrueLayer Beneficiary Resource
 * Beneficiary management for payouts
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
import { validateIBAN, isValidUUID, isValidEmail, isValidSortCode, isValidAccountNumber } from '../../utils/validationUtils';
import { ENDPOINTS } from '../../constants/endpoints';
import { SUPPORTED_CURRENCIES } from '../../constants/currencies';

export const beneficiaryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['beneficiary'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new beneficiary',
				action: 'Create a beneficiary',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a beneficiary',
				action: 'Delete a beneficiary',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a beneficiary by ID',
				action: 'Get a beneficiary',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many beneficiaries',
				action: 'Get many beneficiaries',
			},
			{
				name: 'Verify',
				value: 'verify',
				description: 'Verify a beneficiary',
				action: 'Verify a beneficiary',
			},
		],
		default: 'create',
	},
];

export const beneficiaryFields: INodeProperties[] = [
	// ----------------------------------
	//         beneficiary: create
	// ----------------------------------
	{
		displayName: 'Account Type',
		name: 'accountType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['beneficiary'],
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
		displayName: 'Beneficiary Name',
		name: 'beneficiaryName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the beneficiary account holder',
	},
	{
		displayName: 'Sort Code',
		name: 'sortCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['beneficiary'],
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
				resource: ['beneficiary'],
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
				resource: ['beneficiary'],
				operation: ['create'],
				accountType: ['iban'],
			},
		},
		default: '',
		placeholder: 'GB82WEST12345698765432',
		description: 'International Bank Account Number',
	},
	{
		displayName: 'Reference',
		name: 'reference',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Reference for the beneficiary',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'beneficiary@example.com',
				description: 'Beneficiary email address',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Your reference ID for this beneficiary',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Custom metadata as JSON',
			},
		],
	},

	// ----------------------------------
	//         beneficiary: get
	// ----------------------------------
	{
		displayName: 'Beneficiary ID',
		name: 'beneficiaryId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['get', 'delete', 'verify'],
			},
		},
		default: '',
		description: 'The ID of the beneficiary',
	},

	// ----------------------------------
	//         beneficiary: getMany
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['getMany'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Filter by external reference ID',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Deleted', value: 'deleted' },
				],
				default: 'active',
				description: 'Filter by beneficiary status',
			},
		],
	},

	// ----------------------------------
	//         beneficiary: verify
	// ----------------------------------
	{
		displayName: 'Verification Type',
		name: 'verificationType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['beneficiary'],
				operation: ['verify'],
			},
		},
		options: [
			{
				name: 'Account Ownership',
				value: 'account_ownership',
				description: 'Verify account ownership',
			},
			{
				name: 'Name Match',
				value: 'name_match',
				description: 'Verify name matches account holder',
			},
		],
		default: 'name_match',
		description: 'Type of verification to perform',
	},
];

export async function executeBeneficiaryOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'create') {
		const accountType = this.getNodeParameter('accountType', index) as string;
		const beneficiaryName = this.getNodeParameter('beneficiaryName', index) as string;
		const reference = this.getNodeParameter('reference', index, '') as string;
		const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
			email?: string;
			externalId?: string;
			metadata?: string;
		};

		// Build account details based on type
		let accountDetails: Record<string, unknown>;

		if (accountType === 'sort_code_account_number') {
			const sortCode = this.getNodeParameter('sortCode', index) as string;
			const accountNumber = this.getNodeParameter('accountNumber', index) as string;

			// Validate UK account details
			if (!isValidSortCode(sortCode)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid sort code. Must be 6 digits.',
					{ itemIndex: index },
				);
			}

			if (!isValidAccountNumber(accountNumber)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid account number. Must be 8 digits.',
					{ itemIndex: index },
				);
			}

			accountDetails = {
				type: 'sort_code_account_number',
				sort_code: sortCode.replace(/[^0-9]/g, ''),
				account_number: accountNumber.replace(/[^0-9]/g, ''),
			};
		} else {
			const iban = this.getNodeParameter('iban', index) as string;

			// Validate IBAN
			if (!validateIBAN(iban)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid IBAN format',
					{ itemIndex: index },
				);
			}

			accountDetails = {
				type: 'iban',
				iban: iban.replace(/\s/g, '').toUpperCase(),
			};
		}

		// Validate email if provided
		if (additionalOptions.email && !isValidEmail(additionalOptions.email)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid email address format',
				{ itemIndex: index },
			);
		}

		const body: Record<string, unknown> = {
			beneficiary: {
				name: beneficiaryName,
				account: accountDetails,
			},
		};

		if (reference) {
			body.reference = reference;
		}

		if (additionalOptions.email) {
			(body.beneficiary as Record<string, unknown>).email = additionalOptions.email;
		}

		if (additionalOptions.externalId) {
			body.external_id = additionalOptions.externalId;
		}

		if (additionalOptions.metadata) {
			try {
				body.metadata = JSON.parse(additionalOptions.metadata);
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Metadata must be valid JSON',
					{ itemIndex: index },
				);
			}
		}

		const response = await client.post(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/beneficiaries`,
			body,
			true,
		);

		returnData.push({ json: response });
	}

	if (operation === 'get') {
		const beneficiaryId = this.getNodeParameter('beneficiaryId', index) as string;

		if (!isValidUUID(beneficiaryId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid beneficiary ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/beneficiaries/${beneficiaryId}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', index) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const filters = this.getNodeParameter('filters', index, {}) as {
			externalId?: string;
			status?: string;
		};

		const queryParams: Record<string, string> = {};

		if (filters.externalId) {
			queryParams.external_id = filters.externalId;
		}

		if (filters.status) {
			queryParams.status = filters.status;
		}

		// Build query string
		const queryString = Object.keys(queryParams).length > 0
			? '?' + Object.entries(queryParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
			: '';

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/beneficiaries${queryString}`,
		) as { items: unknown[] };

		const items = response.items || [];
		const results = returnAll ? items : items.slice(0, limit);

		for (const item of results) {
			returnData.push({ json: item as Record<string, unknown> });
		}
	}

	if (operation === 'delete') {
		const beneficiaryId = this.getNodeParameter('beneficiaryId', index) as string;

		if (!isValidUUID(beneficiaryId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid beneficiary ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		await client.delete(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/beneficiaries/${beneficiaryId}`,
		);

		returnData.push({
			json: {
				success: true,
				beneficiaryId,
				message: 'Beneficiary deleted successfully',
			},
		});
	}

	if (operation === 'verify') {
		const beneficiaryId = this.getNodeParameter('beneficiaryId', index) as string;
		const verificationType = this.getNodeParameter('verificationType', index) as string;

		if (!isValidUUID(beneficiaryId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid beneficiary ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const body = {
			verification_type: verificationType,
		};

		const response = await client.post(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/beneficiaries/${beneficiaryId}/verify`,
			body,
			true,
		);

		returnData.push({ json: response });
	}

	return returnData;
}
