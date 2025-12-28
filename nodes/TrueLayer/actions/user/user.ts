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

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Delete Consent',
				value: 'deleteConsent',
				description: 'Revoke a user consent',
				action: 'Delete consent',
			},
			{
				name: 'Get Consent Status',
				value: 'getConsentStatus',
				description: 'Get the status of a consent',
				action: 'Get consent status',
			},
			{
				name: 'Get Consents',
				value: 'getConsents',
				description: 'Get all consents for the authorized user',
				action: 'Get all consents',
			},
			{
				name: 'Refresh Consent',
				value: 'refreshConsent',
				description: 'Refresh a consent to extend its validity',
				action: 'Refresh consent',
			},
		],
		default: 'getConsents',
	},
];

export const userFields: INodeProperties[] = [
	// Consent ID
	{
		displayName: 'Consent ID',
		name: 'consentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['deleteConsent', 'getConsentStatus', 'refreshConsent'],
			},
		},
		default: '',
		description: 'The unique identifier of the consent',
	},
];

export async function executeUserOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('trueLayerOAuth');
	const client = new TrueLayerClient(credentials as any, this);

	let responseData: any;

	switch (operation) {
		case 'getConsents': {
			responseData = await client.get(ENDPOINTS.CONSENTS);
			break;
		}

		case 'getConsentStatus': {
			const consentId = this.getNodeParameter('consentId', index) as string;
			responseData = await client.get(`${ENDPOINTS.CONSENTS}/${consentId}`);
			break;
		}

		case 'deleteConsent': {
			const consentId = this.getNodeParameter('consentId', index) as string;
			responseData = await client.delete(`${ENDPOINTS.CONSENTS}/${consentId}`);
			break;
		}

		case 'refreshConsent': {
			const consentId = this.getNodeParameter('consentId', index) as string;
			responseData = await client.post(`${ENDPOINTS.CONSENTS}/${consentId}/refresh`, {});
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
