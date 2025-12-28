// @ts-nocheck
/**
 * TrueLayer Signup+ Resource
 * Identity verification and onboarding product
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
import { isValidUUID, isValidEmail, isValidUrl } from '../../utils/validationUtils';
import { ENDPOINTS } from '../../constants/endpoints';
import { SUPPORTED_COUNTRIES } from '../../constants/currencies';

export const signupPlusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['signupPlus'],
			},
		},
		options: [
			{
				name: 'Get Data',
				value: 'getData',
				description: 'Get signup data and verified information',
				action: 'Get signup data',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get signup flow status',
				action: 'Get signup status',
			},
			{
				name: 'Get Verified Identity',
				value: 'getVerifiedIdentity',
				description: 'Get verified identity data',
				action: 'Get verified identity',
			},
			{
				name: 'Start Flow',
				value: 'startFlow',
				description: 'Start a new Signup+ verification flow',
				action: 'Start signup flow',
			},
		],
		default: 'startFlow',
	},
];

export const signupPlusFields: INodeProperties[] = [
	// ----------------------------------
	//         signupPlus: startFlow
	// ----------------------------------
	{
		displayName: 'User Email',
		name: 'userEmail',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['startFlow'],
			},
		},
		default: '',
		placeholder: 'user@example.com',
		description: 'Email address of the user to verify',
	},
	{
		displayName: 'Redirect URI',
		name: 'redirectUri',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['startFlow'],
			},
		},
		default: '',
		placeholder: 'https://your-app.com/signup/callback',
		description: 'URI to redirect user after verification',
	},
	{
		displayName: 'Verification Type',
		name: 'verificationType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['startFlow'],
			},
		},
		options: [
			{
				name: 'Full Identity',
				value: 'full_identity',
				description: 'Full identity verification including name, address, date of birth',
			},
			{
				name: 'Bank Account',
				value: 'bank_account',
				description: 'Verify bank account ownership',
			},
			{
				name: 'Income',
				value: 'income',
				description: 'Verify income information',
			},
			{
				name: 'Employment',
				value: 'employment',
				description: 'Verify employment status',
			},
		],
		default: 'full_identity',
		description: 'Type of verification to perform',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['startFlow'],
			},
		},
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: [
					{ name: 'United Kingdom', value: 'GB' },
					{ name: 'Ireland', value: 'IE' },
					{ name: 'Germany', value: 'DE' },
					{ name: 'France', value: 'FR' },
					{ name: 'Spain', value: 'ES' },
					{ name: 'Italy', value: 'IT' },
					{ name: 'Netherlands', value: 'NL' },
					{ name: 'Belgium', value: 'BE' },
					{ name: 'Poland', value: 'PL' },
				],
				default: 'GB',
				description: 'Country for verification',
			},
			{
				displayName: 'External User ID',
				name: 'externalUserId',
				type: 'string',
				default: '',
				description: 'Your internal user ID for reference',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'Pre-fill user first name',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'Pre-fill user last name',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Custom metadata as JSON',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				placeholder: '+447123456789',
				description: 'User phone number',
			},
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'string',
				default: '',
				description: 'Pre-select a specific bank provider',
			},
			{
				displayName: 'Webhook URI',
				name: 'webhookUri',
				type: 'string',
				default: '',
				description: 'Webhook URL for signup events',
			},
		],
	},

	// ----------------------------------
	//         signupPlus: getStatus / getData / getVerifiedIdentity
	// ----------------------------------
	{
		displayName: 'Signup ID',
		name: 'signupId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['getStatus', 'getData', 'getVerifiedIdentity'],
			},
		},
		default: '',
		description: 'The ID of the signup flow',
	},

	// ----------------------------------
	//         signupPlus: getData
	// ----------------------------------
	{
		displayName: 'Data Options',
		name: 'dataOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['signupPlus'],
				operation: ['getData'],
			},
		},
		options: [
			{
				displayName: 'Include Accounts',
				name: 'includeAccounts',
				type: 'boolean',
				default: true,
				description: 'Whether to include linked bank account data',
			},
			{
				displayName: 'Include Identity',
				name: 'includeIdentity',
				type: 'boolean',
				default: true,
				description: 'Whether to include verified identity information',
			},
			{
				displayName: 'Include Transactions',
				name: 'includeTransactions',
				type: 'boolean',
				default: false,
				description: 'Whether to include transaction history',
			},
		],
	},
];

export async function executeSignupPlusOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'startFlow') {
		const userEmail = this.getNodeParameter('userEmail', index) as string;
		const redirectUri = this.getNodeParameter('redirectUri', index) as string;
		const verificationType = this.getNodeParameter('verificationType', index) as string;
		const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
			externalUserId?: string;
			firstName?: string;
			lastName?: string;
			phoneNumber?: string;
			country?: string;
			providerId?: string;
			webhookUri?: string;
			metadata?: string;
		};

		// Validate email
		if (!isValidEmail(userEmail)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid email address format',
				{ itemIndex: index },
			);
		}

		// Validate redirect URI
		if (!isValidUrl(redirectUri)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid redirect URI format',
				{ itemIndex: index },
			);
		}

		// Validate webhook URI if provided
		if (additionalOptions.webhookUri && !isValidUrl(additionalOptions.webhookUri)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook URI format',
				{ itemIndex: index },
			);
		}

		const body: Record<string, unknown> = {
			user: {
				email: userEmail,
			},
			redirect_uri: redirectUri,
			verification_type: verificationType,
		};

		// Add optional user details
		if (additionalOptions.firstName || additionalOptions.lastName) {
			(body.user as Record<string, unknown>).name = {};
			if (additionalOptions.firstName) {
				((body.user as Record<string, unknown>).name as Record<string, unknown>).first_name = additionalOptions.firstName;
			}
			if (additionalOptions.lastName) {
				((body.user as Record<string, unknown>).name as Record<string, unknown>).last_name = additionalOptions.lastName;
			}
		}

		if (additionalOptions.phoneNumber) {
			(body.user as Record<string, unknown>).phone = additionalOptions.phoneNumber;
		}

		if (additionalOptions.externalUserId) {
			body.external_user_id = additionalOptions.externalUserId;
		}

		if (additionalOptions.country) {
			body.country = additionalOptions.country;
		}

		if (additionalOptions.providerId) {
			body.provider_id = additionalOptions.providerId;
		}

		if (additionalOptions.webhookUri) {
			body.webhook_uri = additionalOptions.webhookUri;
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
			`${ENDPOINTS.PAYMENTS.BASE}/v3/signup`,
			body,
			true,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getStatus') {
		const signupId = this.getNodeParameter('signupId', index) as string;

		if (!isValidUUID(signupId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid signup ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/signup/${signupId}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getData') {
		const signupId = this.getNodeParameter('signupId', index) as string;
		const dataOptions = this.getNodeParameter('dataOptions', index, {}) as {
			includeIdentity?: boolean;
			includeAccounts?: boolean;
			includeTransactions?: boolean;
		};

		if (!isValidUUID(signupId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid signup ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const queryParams: string[] = [];

		if (dataOptions.includeIdentity !== false) {
			queryParams.push('include=identity');
		}

		if (dataOptions.includeAccounts !== false) {
			queryParams.push('include=accounts');
		}

		if (dataOptions.includeTransactions) {
			queryParams.push('include=transactions');
		}

		const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/signup/${signupId}/data${queryString}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getVerifiedIdentity') {
		const signupId = this.getNodeParameter('signupId', index) as string;

		if (!isValidUUID(signupId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid signup ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/signup/${signupId}/identity`,
		);

		returnData.push({ json: response });
	}

	return returnData;
}
