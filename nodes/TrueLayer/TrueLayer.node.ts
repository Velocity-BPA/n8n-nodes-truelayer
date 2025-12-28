/**
 * TrueLayer n8n Community Node
 * Comprehensive open banking integration for payments, payouts, mandates, and account data
 *
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 *
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// Import resource operations and fields
import { paymentOperations, paymentFields, executePaymentOperation } from './actions/payment/payment';
import { payoutOperations, payoutFields, executePayoutOperation } from './actions/payout/payout';
import { merchantAccountOperations, merchantAccountFields, executeMerchantAccountOperation } from './actions/merchantAccount/merchantAccount';
import { standingOrderOperations, standingOrderFields, executeStandingOrderOperation } from './actions/standingOrder/standingOrder';
import { mandateOperations, mandateFields, executeMandateOperation } from './actions/mandate/mandate';
import { dataAccountOperations, dataAccountFields, executeDataAccountOperation } from './actions/dataAccount/dataAccount';
import { dataCardOperations, dataCardFields, executeDataCardOperation } from './actions/dataCard/dataCard';
import { dataIdentityOperations, dataIdentityFields, executeDataIdentityOperation } from './actions/dataIdentity/dataIdentity';
import { bankOperations, bankFields, executeBankOperation } from './actions/bank/bank';
import { userOperations, userFields, executeUserOperation } from './actions/user/user';
import { authLinkOperations, authLinkFields, executeAuthLinkOperation } from './actions/authLink/authLink';
import { beneficiaryOperations, beneficiaryFields, executeBeneficiaryOperation } from './actions/beneficiary/beneficiary';
import { verificationOperations, verificationFields, executeVerificationOperation } from './actions/verification/verification';
import { webhookOperations, webhookFields, executeWebhookOperation } from './actions/webhook/webhook';
import { signupPlusOperations, signupPlusFields, executeSignupPlusOperation } from './actions/signupPlus/signupPlus';
import { tokenOperations, tokenFields, executeTokenOperation } from './actions/token/token';
import { reportingOperations, reportingFields, executeReportingOperation } from './actions/reporting/reporting';
import { configurationOperations, configurationFields, executeConfigurationOperation } from './actions/configuration/configuration';
import { utilityOperations, utilityFields, executeUtilityOperation } from './actions/utility/utility';

export class TrueLayer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrueLayer',
		name: 'trueLayer',
		icon: 'file:truelayer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with TrueLayer Open Banking API for payments, payouts, mandates, and account data',
		defaults: {
			name: 'TrueLayer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'trueLayerApi',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'payment',
							'payout',
							'merchantAccount',
							'standingOrder',
							'mandate',
							'beneficiary',
							'verification',
							'webhook',
							'signupPlus',
							'token',
							'reporting',
							'configuration',
							'utility',
						],
					},
				},
			},
			{
				name: 'trueLayerOAuth',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'dataAccount',
							'dataCard',
							'dataIdentity',
							'bank',
							'user',
							'authLink',
						],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Auth Link',
						value: 'authLink',
						description: 'Generate authorization links for user consent',
					},
					{
						name: 'Bank',
						value: 'bank',
						description: 'Search and retrieve bank provider information',
					},
					{
						name: 'Beneficiary',
						value: 'beneficiary',
						description: 'Manage beneficiaries for payouts',
					},
					{
						name: 'Configuration',
						value: 'configuration',
						description: 'API configuration and supported features',
					},
					{
						name: 'Data API - Account',
						value: 'dataAccount',
						description: 'Access user bank account data (requires OAuth consent)',
					},
					{
						name: 'Data API - Card',
						value: 'dataCard',
						description: 'Access user card data (requires OAuth consent)',
					},
					{
						name: 'Data API - Identity',
						value: 'dataIdentity',
						description: 'Access user identity information (requires OAuth consent)',
					},
					{
						name: 'Mandate (VRP)',
						value: 'mandate',
						description: 'Variable Recurring Payments mandates',
					},
					{
						name: 'Merchant Account',
						value: 'merchantAccount',
						description: 'Manage merchant accounts, balances, and sweeping',
					},
					{
						name: 'Payment',
						value: 'payment',
						description: 'Create and manage single immediate payments',
					},
					{
						name: 'Payout',
						value: 'payout',
						description: 'Create payouts from merchant account to beneficiaries',
					},
					{
						name: 'Reporting',
						value: 'reporting',
						description: 'Generate payment and reconciliation reports',
					},
					{
						name: 'Signup+',
						value: 'signupPlus',
						description: 'Identity verification and onboarding',
					},
					{
						name: 'Standing Order',
						value: 'standingOrder',
						description: 'Create and manage standing orders',
					},
					{
						name: 'Token',
						value: 'token',
						description: 'OAuth token management',
					},
					{
						name: 'User',
						value: 'user',
						description: 'Manage user consents',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility operations for validation and testing',
					},
					{
						name: 'Verification',
						value: 'verification',
						description: 'Account ownership and name verification',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Manage webhook endpoints and events',
					},
				],
				default: 'payment',
			},

			// Import all operations
			...paymentOperations,
			...payoutOperations,
			...merchantAccountOperations,
			...standingOrderOperations,
			...mandateOperations,
			...dataAccountOperations,
			...dataCardOperations,
			...dataIdentityOperations,
			...bankOperations,
			...userOperations,
			...authLinkOperations,
			...beneficiaryOperations,
			...verificationOperations,
			...webhookOperations,
			...signupPlusOperations,
			...tokenOperations,
			...reportingOperations,
			...configurationOperations,
			...utilityOperations,

			// Import all fields
			...paymentFields,
			...payoutFields,
			...merchantAccountFields,
			...standingOrderFields,
			...mandateFields,
			...dataAccountFields,
			...dataCardFields,
			...dataIdentityFields,
			...bankFields,
			...userFields,
			...authLinkFields,
			...beneficiaryFields,
			...verificationFields,
			...webhookFields,
			...signupPlusFields,
			...tokenFields,
			...reportingFields,
			...configurationFields,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		// Determine which credentials to use based on resource
		const useOAuth = ['dataAccount', 'dataCard', 'dataIdentity', 'bank', 'user', 'authLink'].includes(resource);
		const credentialType = useOAuth ? 'trueLayerOAuth' : 'trueLayerApi';

		for (let i = 0; i < items.length; i++) {
			try {
				// Validate credentials are available
				await this.getCredentials(credentialType);

				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'payment':
						result = await executePaymentOperation.call(this, i);
						break;
					case 'payout':
						result = await executePayoutOperation.call(this, i);
						break;
					case 'merchantAccount':
						result = await executeMerchantAccountOperation.call(this, i);
						break;
					case 'standingOrder':
						result = await executeStandingOrderOperation.call(this, i);
						break;
					case 'mandate':
						result = await executeMandateOperation.call(this, i);
						break;
					case 'dataAccount':
						result = await executeDataAccountOperation.call(this, i);
						break;
					case 'dataCard':
						result = await executeDataCardOperation.call(this, i);
						break;
					case 'dataIdentity':
						result = await executeDataIdentityOperation.call(this, i);
						break;
					case 'bank':
						result = await executeBankOperation.call(this, i);
						break;
					case 'user':
						result = await executeUserOperation.call(this, i);
						break;
					case 'authLink':
						result = await executeAuthLinkOperation.call(this, i);
						break;
					case 'beneficiary':
						result = await executeBeneficiaryOperation.call(this, i);
						break;
					case 'verification':
						result = await executeVerificationOperation.call(this, i);
						break;
					case 'webhook':
						result = await executeWebhookOperation.call(this, i);
						break;
					case 'signupPlus':
						result = await executeSignupPlusOperation.call(this, i);
						break;
					case 'token':
						result = await executeTokenOperation.call(this, i);
						break;
					case 'reporting':
						result = await executeReportingOperation.call(this, i);
						break;
					case 'configuration':
						result = await executeConfigurationOperation.call(this, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: ${resource}`,
							{ itemIndex: i },
						);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
