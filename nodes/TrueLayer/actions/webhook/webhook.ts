// @ts-nocheck
/**
 * TrueLayer Webhook Resource
 * Webhook endpoint management and event handling
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
import { isValidUUID, isValidUrl } from '../../utils/validationUtils';
import { ENDPOINTS } from '../../constants/endpoints';
import { WEBHOOK_EVENT_TYPES } from '../../constants/eventTypes';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new webhook endpoint',
				action: 'Create a webhook',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a webhook endpoint',
				action: 'Delete a webhook',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a webhook by ID',
				action: 'Get a webhook',
			},
			{
				name: 'Get Events',
				value: 'getEvents',
				description: 'Get webhook event delivery history',
				action: 'Get webhook events',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many webhooks',
				action: 'Get many webhooks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a webhook endpoint',
				action: 'Update a webhook',
			},
			{
				name: 'Verify Signature',
				value: 'verifySignature',
				description: 'Verify a webhook signature',
				action: 'Verify webhook signature',
			},
		],
		default: 'create',
	},
];

export const webhookFields: INodeProperties[] = [
	// ----------------------------------
	//         webhook: create
	// ----------------------------------
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'https://your-server.com/webhooks/truelayer',
		description: 'URL where webhook events will be sent',
	},
	{
		displayName: 'Event Types',
		name: 'eventTypes',
		type: 'multiOptions',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			// Payment events
			{ name: 'Payment Authorized', value: 'payment_authorized' },
			{ name: 'Payment Executed', value: 'payment_executed' },
			{ name: 'Payment Settled', value: 'payment_settled' },
			{ name: 'Payment Failed', value: 'payment_failed' },
			{ name: 'Payment Cancelled', value: 'payment_cancelled' },
			// Payout events
			{ name: 'Payout Executed', value: 'payout_executed' },
			{ name: 'Payout Failed', value: 'payout_failed' },
			{ name: 'Payout Pending', value: 'payout_pending' },
			// Refund events
			{ name: 'Refund Executed', value: 'refund_executed' },
			{ name: 'Refund Failed', value: 'refund_failed' },
			{ name: 'Refund Pending', value: 'refund_pending' },
			// Mandate events
			{ name: 'Mandate Authorized', value: 'mandate_authorized' },
			{ name: 'Mandate Revoked', value: 'mandate_revoked' },
			// Merchant account events
			{ name: 'Transaction Received', value: 'transaction_received' },
			{ name: 'Balance Changed', value: 'balance_changed' },
			// Consent events
			{ name: 'Consent Granted', value: 'consent_granted' },
			{ name: 'Consent Revoked', value: 'consent_revoked' },
			// Verification events
			{ name: 'Verification Completed', value: 'verification_completed' },
			{ name: 'Verification Failed', value: 'verification_failed' },
		],
		default: [],
		description: 'Types of events to subscribe to',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of this webhook endpoint',
			},
			{
				displayName: 'Enabled',
				name: 'enabled',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook is enabled',
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'header',
						displayName: 'Header',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Custom headers to send with webhook requests',
			},
		],
	},

	// ----------------------------------
	//         webhook: get / delete
	// ----------------------------------
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['get', 'delete', 'update', 'getEvents'],
			},
		},
		default: '',
		description: 'The ID of the webhook',
	},

	// ----------------------------------
	//         webhook: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Updated description',
			},
			{
				displayName: 'Enabled',
				name: 'enabled',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook is enabled',
			},
			{
				displayName: 'Event Types',
				name: 'eventTypes',
				type: 'multiOptions',
				options: [
					{ name: 'Payment Authorized', value: 'payment_authorized' },
					{ name: 'Payment Executed', value: 'payment_executed' },
					{ name: 'Payment Settled', value: 'payment_settled' },
					{ name: 'Payment Failed', value: 'payment_failed' },
					{ name: 'Payout Executed', value: 'payout_executed' },
					{ name: 'Payout Failed', value: 'payout_failed' },
					{ name: 'Refund Executed', value: 'refund_executed' },
					{ name: 'Mandate Authorized', value: 'mandate_authorized' },
					{ name: 'Transaction Received', value: 'transaction_received' },
					{ name: 'Consent Granted', value: 'consent_granted' },
					{ name: 'Verification Completed', value: 'verification_completed' },
				],
				default: [],
				description: 'Updated event types',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'Updated webhook URL',
			},
		],
	},

	// ----------------------------------
	//         webhook: getMany
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['webhook'],
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
				resource: ['webhook'],
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

	// ----------------------------------
	//         webhook: getEvents
	// ----------------------------------
	{
		displayName: 'Events Options',
		name: 'eventsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getEvents'],
			},
		},
		options: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payment Events', value: 'payment' },
					{ name: 'Payout Events', value: 'payout' },
					{ name: 'Refund Events', value: 'refund' },
					{ name: 'Mandate Events', value: 'mandate' },
				],
				default: '',
				description: 'Filter by event type',
			},
			{
				displayName: 'From Date',
				name: 'fromDate',
				type: 'dateTime',
				default: '',
				description: 'Return events from this date',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				description: 'Max number of events to return',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Delivered', value: 'delivered' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Pending', value: 'pending' },
				],
				default: '',
				description: 'Filter by delivery status',
			},
			{
				displayName: 'To Date',
				name: 'toDate',
				type: 'dateTime',
				default: '',
				description: 'Return events up to this date',
			},
		],
	},

	// ----------------------------------
	//         webhook: verifySignature
	// ----------------------------------
	{
		displayName: 'Signature Header',
		name: 'signatureHeader',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['verifySignature'],
			},
		},
		default: '',
		description: 'The Tl-Signature header from the webhook request',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['verifySignature'],
			},
		},
		default: '',
		description: 'The raw webhook payload body',
	},
	{
		displayName: 'Webhook Path',
		name: 'webhookPath',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['verifySignature'],
			},
		},
		default: '/webhooks/truelayer',
		description: 'The path of your webhook endpoint',
	},
];

export async function executeWebhookOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	if (operation === 'create') {
		const webhookUrl = this.getNodeParameter('webhookUrl', index) as string;
		const eventTypes = this.getNodeParameter('eventTypes', index) as string[];
		const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
			description?: string;
			enabled?: boolean;
			headers?: { header: Array<{ name: string; value: string }> };
		};

		// Validate URL
		if (!isValidUrl(webhookUrl)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook URL. Must be a valid HTTPS URL.',
				{ itemIndex: index },
			);
		}

		if (!webhookUrl.startsWith('https://')) {
			throw new NodeOperationError(
				this.getNode(),
				'Webhook URL must use HTTPS for security',
				{ itemIndex: index },
			);
		}

		if (eventTypes.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one event type must be selected',
				{ itemIndex: index },
			);
		}

		const body: Record<string, unknown> = {
			url: webhookUrl,
			event_types: eventTypes,
		};

		if (additionalOptions.description) {
			body.description = additionalOptions.description;
		}

		if (additionalOptions.enabled !== undefined) {
			body.enabled = additionalOptions.enabled;
		}

		if (additionalOptions.headers?.header && additionalOptions.headers.header.length > 0) {
			const headers: Record<string, string> = {};
			for (const h of additionalOptions.headers.header) {
				headers[h.name] = h.value;
			}
			body.headers = headers;
		}

		const response = await client.post(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks`,
			body,
			true,
		);

		returnData.push({ json: response });
	}

	if (operation === 'get') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		if (!isValidUUID(webhookId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks/${webhookId}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', index) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks`,
		) as { items: unknown[] };

		const items = response.items || [];
		const results = returnAll ? items : items.slice(0, limit);

		for (const item of results) {
			returnData.push({ json: item as Record<string, unknown> });
		}
	}

	if (operation === 'update') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const updateFields = this.getNodeParameter('updateFields', index, {}) as {
			url?: string;
			description?: string;
			enabled?: boolean;
			eventTypes?: string[];
		};

		if (!isValidUUID(webhookId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const body: Record<string, unknown> = {};

		if (updateFields.url) {
			if (!isValidUrl(updateFields.url)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid webhook URL format',
					{ itemIndex: index },
				);
			}
			body.url = updateFields.url;
		}

		if (updateFields.description !== undefined) {
			body.description = updateFields.description;
		}

		if (updateFields.enabled !== undefined) {
			body.enabled = updateFields.enabled;
		}

		if (updateFields.eventTypes && updateFields.eventTypes.length > 0) {
			body.event_types = updateFields.eventTypes;
		}

		const response = await client.patch(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks/${webhookId}`,
			body,
		);

		returnData.push({ json: response });
	}

	if (operation === 'delete') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		if (!isValidUUID(webhookId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		await client.delete(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks/${webhookId}`,
		);

		returnData.push({
			json: {
				success: true,
				webhookId,
				message: 'Webhook deleted successfully',
			},
		});
	}

	if (operation === 'getEvents') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const eventsOptions = this.getNodeParameter('eventsOptions', index, {}) as {
			eventType?: string;
			status?: string;
			fromDate?: string;
			toDate?: string;
			limit?: number;
		};

		if (!isValidUUID(webhookId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const queryParams: Record<string, string> = {};

		if (eventsOptions.eventType) {
			queryParams.event_type = eventsOptions.eventType;
		}

		if (eventsOptions.status) {
			queryParams.status = eventsOptions.status;
		}

		if (eventsOptions.fromDate) {
			queryParams.from = new Date(eventsOptions.fromDate).toISOString();
		}

		if (eventsOptions.toDate) {
			queryParams.to = new Date(eventsOptions.toDate).toISOString();
		}

		if (eventsOptions.limit) {
			queryParams.limit = eventsOptions.limit.toString();
		}

		const queryString = Object.keys(queryParams).length > 0
			? '?' + Object.entries(queryParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
			: '';

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/webhooks/${webhookId}/events${queryString}`,
		) as { items: unknown[] };

		const items = response.items || [];

		for (const item of items) {
			returnData.push({ json: item as Record<string, unknown> });
		}
	}

	if (operation === 'verifySignature') {
		const signatureHeader = this.getNodeParameter('signatureHeader', index) as string;
		const payload = this.getNodeParameter('payload', index) as string;
		const webhookPath = this.getNodeParameter('webhookPath', index) as string;

		// Import webhook handler for signature verification
		const { verifyWebhookSignature } = await import('../../transport/webhookHandler');

		// Get webhook secret from credentials
		const credentials = await this.getCredentials('trueLayerApi');
		const webhookSecret = credentials.webhookSecret as string;

		if (!webhookSecret) {
			throw new NodeOperationError(
				this.getNode(),
				'Webhook secret not configured in credentials',
				{ itemIndex: index },
			);
		}

		try {
			const isValid = verifyWebhookSignature(
				signatureHeader,
				payload,
				webhookSecret,
				'POST',
				webhookPath,
			);

			returnData.push({
				json: {
					valid: isValid,
					message: isValid ? 'Signature is valid' : 'Signature is invalid',
				},
			});
		} catch (error) {
			returnData.push({
				json: {
					valid: false,
					error: (error as Error).message,
				},
			});
		}
	}

	return returnData;
}
