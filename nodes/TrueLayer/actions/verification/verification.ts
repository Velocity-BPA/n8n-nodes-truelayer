// @ts-nocheck
/**
 * TrueLayer Verification Resource
 * Account ownership and identity verification
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
import { validateIBAN, isValidUUID, isValidSortCode, isValidAccountNumber } from '../../utils/validationUtils';
import { ENDPOINTS } from '../../constants/endpoints';
import { SUPPORTED_COUNTRIES } from '../../constants/currencies';

export const verificationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['verification'],
			},
		},
		options: [
			{
				name: 'Get Ownership Verification',
				value: 'getOwnership',
				description: 'Get account ownership verification result',
				action: 'Get ownership verification',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get verification status',
				action: 'Get verification status',
			},
			{
				name: 'Verify Account',
				value: 'verifyAccount',
				description: 'Verify account ownership',
				action: 'Verify an account',
			},
		],
		default: 'verifyAccount',
	},
];

export const verificationFields: INodeProperties[] = [
	// ----------------------------------
	//         verification: verifyAccount
	// ----------------------------------
	{
		displayName: 'Account Type',
		name: 'accountType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['verification'],
				operation: ['verifyAccount'],
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
		description: 'Type of account to verify',
	},
	{
		displayName: 'Account Holder Name',
		name: 'accountHolderName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['verification'],
				operation: ['verifyAccount'],
			},
		},
		default: '',
		description: 'Name of the account holder to verify',
	},
	{
		displayName: 'Sort Code',
		name: 'sortCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['verification'],
				operation: ['verifyAccount'],
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
				resource: ['verification'],
				operation: ['verifyAccount'],
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
				resource: ['verification'],
				operation: ['verifyAccount'],
				accountType: ['iban'],
			},
		},
		default: '',
		placeholder: 'GB82WEST12345698765432',
		description: 'International Bank Account Number',
	},
	{
		displayName: 'Verification Type',
		name: 'verificationType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['verification'],
				operation: ['verifyAccount'],
			},
		},
		options: [
			{
				name: 'Confirmation of Payee (CoP)',
				value: 'cop',
				description: 'UK Confirmation of Payee service',
			},
			{
				name: 'Name Verification',
				value: 'name_verification',
				description: 'Verify account holder name matches',
			},
			{
				name: 'IBAN Name Check',
				value: 'iban_name_check',
				description: 'SEPA IBAN name verification',
			},
		],
		default: 'cop',
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
				resource: ['verification'],
				operation: ['verifyAccount'],
			},
		},
		options: [
			{
				displayName: 'Account Type Classification',
				name: 'accountTypeClassification',
				type: 'options',
				options: [
					{ name: 'Personal', value: 'personal' },
					{ name: 'Business', value: 'business' },
				],
				default: 'personal',
				description: 'Whether the account is personal or business',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Your reference for this verification',
			},
			{
				displayName: 'Secondary Name',
				name: 'secondaryName',
				type: 'string',
				default: '',
				description: 'Secondary account holder name (for joint accounts)',
			},
		],
	},

	// ----------------------------------
	//         verification: getStatus / getOwnership
	// ----------------------------------
	{
		displayName: 'Verification ID',
		name: 'verificationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['verification'],
				operation: ['getStatus', 'getOwnership'],
			},
		},
		default: '',
		description: 'The ID of the verification request',
	},
];

export async function executeVerificationOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'verifyAccount') {
		const accountType = this.getNodeParameter('accountType', index) as string;
		const accountHolderName = this.getNodeParameter('accountHolderName', index) as string;
		const verificationType = this.getNodeParameter('verificationType', index) as string;
		const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
			accountTypeClassification?: string;
			reference?: string;
			secondaryName?: string;
		};

		// Build account details based on type
		let accountIdentifier: Record<string, unknown>;

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

			accountIdentifier = {
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

			accountIdentifier = {
				type: 'iban',
				iban: iban.replace(/\s/g, '').toUpperCase(),
			};
		}

		const body: Record<string, unknown> = {
			account_holder_name: accountHolderName,
			account_identifier: accountIdentifier,
			verification_type: verificationType,
		};

		if (additionalOptions.accountTypeClassification) {
			body.account_type = additionalOptions.accountTypeClassification;
		}

		if (additionalOptions.reference) {
			body.reference = additionalOptions.reference;
		}

		if (additionalOptions.secondaryName) {
			body.secondary_account_holder_name = additionalOptions.secondaryName;
		}

		const response = await client.post(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/verification`,
			body,
			true,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getStatus') {
		const verificationId = this.getNodeParameter('verificationId', index) as string;

		if (!isValidUUID(verificationId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid verification ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/verification/${verificationId}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getOwnership') {
		const verificationId = this.getNodeParameter('verificationId', index) as string;

		if (!isValidUUID(verificationId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid verification ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/verification/${verificationId}/ownership`,
		);

		returnData.push({ json: response });
	}

	return returnData;
}
