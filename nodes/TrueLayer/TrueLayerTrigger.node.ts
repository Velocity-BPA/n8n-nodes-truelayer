/**
 * TrueLayer Trigger Node
 * Webhook-based event triggers for real-time notifications
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
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';

import { verifyWebhookSignature, parseWebhookEvent, categorizeEvent } from './transport/webhookHandler';
import { WEBHOOK_EVENT_TYPES } from './constants/eventTypes';

export class TrueLayerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrueLayer Trigger',
		name: 'trueLayerTrigger',
		icon: 'file:truelayer.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on TrueLayer webhook events',
		defaults: {
			name: 'TrueLayer Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'trueLayerApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				options: [
					{
						name: 'All Events',
						value: 'all',
						description: 'Receive all TrueLayer webhook events',
					},
					{
						name: 'Payment Events',
						value: 'payment',
						description: 'Payment lifecycle events',
					},
					{
						name: 'Payout Events',
						value: 'payout',
						description: 'Payout status events',
					},
					{
						name: 'Refund Events',
						value: 'refund',
						description: 'Refund lifecycle events',
					},
					{
						name: 'Mandate Events',
						value: 'mandate',
						description: 'VRP mandate events',
					},
					{
						name: 'Standing Order Events',
						value: 'standingOrder',
						description: 'Standing order lifecycle events',
					},
					{
						name: 'Merchant Account Events',
						value: 'merchantAccount',
						description: 'Merchant account transaction events',
					},
					{
						name: 'Consent Events',
						value: 'consent',
						description: 'User consent events',
					},
					{
						name: 'Verification Events',
						value: 'verification',
						description: 'Account verification events',
					},
					{
						name: 'Signup Events',
						value: 'signup',
						description: 'Signup+ identity verification events',
					},
				],
				default: 'all',
				description: 'Category of events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['payment'],
					},
				},
				options: [
					{ name: 'Payment Authorized', value: 'payment_authorized' },
					{ name: 'Payment Executed', value: 'payment_executed' },
					{ name: 'Payment Settled', value: 'payment_settled' },
					{ name: 'Payment Failed', value: 'payment_failed' },
					{ name: 'Payment Cancelled', value: 'payment_cancelled' },
					{ name: 'Payment Pending', value: 'payment_pending' },
				],
				default: [],
				description: 'Specific payment events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['payout'],
					},
				},
				options: [
					{ name: 'Payout Executed', value: 'payout_executed' },
					{ name: 'Payout Failed', value: 'payout_failed' },
					{ name: 'Payout Pending', value: 'payout_pending' },
				],
				default: [],
				description: 'Specific payout events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['refund'],
					},
				},
				options: [
					{ name: 'Refund Executed', value: 'refund_executed' },
					{ name: 'Refund Failed', value: 'refund_failed' },
					{ name: 'Refund Pending', value: 'refund_pending' },
				],
				default: [],
				description: 'Specific refund events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['mandate'],
					},
				},
				options: [
					{ name: 'Mandate Authorized', value: 'mandate_authorized' },
					{ name: 'Mandate Revoked', value: 'mandate_revoked' },
					{ name: 'Mandate Failed', value: 'mandate_failed' },
					{ name: 'Mandate Payment Executed', value: 'mandate_payment_executed' },
					{ name: 'Mandate Payment Failed', value: 'mandate_payment_failed' },
				],
				default: [],
				description: 'Specific mandate events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['standingOrder'],
					},
				},
				options: [
					{ name: 'Standing Order Created', value: 'standing_order_created' },
					{ name: 'Standing Order Executed', value: 'standing_order_executed' },
					{ name: 'Standing Order Failed', value: 'standing_order_failed' },
					{ name: 'Standing Order Cancelled', value: 'standing_order_cancelled' },
				],
				default: [],
				description: 'Specific standing order events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['merchantAccount'],
					},
				},
				options: [
					{ name: 'Transaction Received', value: 'transaction_received' },
					{ name: 'Balance Changed', value: 'balance_changed' },
					{ name: 'Sweep Executed', value: 'sweep_executed' },
				],
				default: [],
				description: 'Specific merchant account events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['consent'],
					},
				},
				options: [
					{ name: 'Consent Granted', value: 'consent_granted' },
					{ name: 'Consent Revoked', value: 'consent_revoked' },
					{ name: 'Consent Expired', value: 'consent_expired' },
				],
				default: [],
				description: 'Specific consent events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['verification'],
					},
				},
				options: [
					{ name: 'Verification Completed', value: 'verification_completed' },
					{ name: 'Verification Failed', value: 'verification_failed' },
				],
				default: [],
				description: 'Specific verification events to listen for',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						eventCategory: ['signup'],
					},
				},
				options: [
					{ name: 'Signup Started', value: 'signup_started' },
					{ name: 'Signup Completed', value: 'signup_completed' },
					{ name: 'Identity Verified', value: 'identity_verified' },
				],
				default: [],
				description: 'Specific signup events to listen for',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Verify Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description: 'Whether to verify the webhook signature using the webhook secret',
					},
					{
						displayName: 'Include Raw Body',
						name: 'includeRawBody',
						type: 'boolean',
						default: false,
						description: 'Whether to include the raw request body in the output',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Webhooks are managed externally in TrueLayer Console
				// This just returns true to indicate the webhook path is ready
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// Webhook registration happens in TrueLayer Console
				// Return the webhook URL for manual registration
				const webhookUrl = this.getNodeWebhookUrl('default');
				console.log(`TrueLayer webhook URL: ${webhookUrl}`);
				console.log('Register this URL in your TrueLayer Console webhook settings');
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// Webhook deletion happens in TrueLayer Console
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = this.getBodyData() as Record<string, unknown>;
		const headers = this.getHeaderData() as Record<string, string>;
		
		const eventCategory = this.getNodeParameter('eventCategory') as string;
		const events = this.getNodeParameter('events', []) as string[];
		const options = this.getNodeParameter('options', {}) as {
			verifySignature?: boolean;
			includeRawBody?: boolean;
		};

		// Verify webhook signature if enabled
		if (options.verifySignature !== false) {
			try {
				const credentials = await this.getCredentials('trueLayerApi');
				const webhookSecret = credentials.webhookSecret as string;

				if (webhookSecret) {
					const signature = headers['tl-signature'] || headers['x-tl-signature'];
					const rawBody = JSON.stringify(body);

					const isValid = verifyWebhookSignature(
						rawBody,
						signature,
						webhookSecret,
					);

					if (!isValid) {
						return {
							webhookResponse: {
								status: 401,
								body: { error: 'Invalid webhook signature' },
							},
						};
					}
				}
			} catch (error) {
				console.error('Webhook signature verification error:', error);
				// Continue processing if verification fails but was optional
			}
		}

		// Parse the webhook event
		const event = parseWebhookEvent(body as IDataObject);
		
		if (!event) {
			return {
				webhookResponse: {
					status: 400,
					body: { error: 'Invalid webhook payload' },
				},
			};
		}

		// Get event category
		const eventType = event.type as string;
		const category = categorizeEvent(eventType);

		// Filter by category if not 'all'
		if (eventCategory !== 'all' && category !== eventCategory) {
			// Event doesn't match category, acknowledge but don't trigger workflow
			return {
				webhookResponse: {
					status: 200,
					body: { received: true, filtered: true },
				},
			};
		}

		// Filter by specific events if specified
		if (events.length > 0 && !events.includes(eventType)) {
			return {
				webhookResponse: {
					status: 200,
					body: { received: true, filtered: true },
				},
			};
		}

		// Build output data
		const outputData: IDataObject = {
			event_type: eventType,
			event_category: category,
			timestamp: new Date().toISOString(),
			...(event as any),
		};

		// Include raw body if requested
		if (options.includeRawBody) {
			outputData.raw_body = body;
		}

		// Add headers info
		outputData.webhook_headers = {
			signature: headers['tl-signature'] || headers['x-tl-signature'],
			idempotency_key: headers['idempotency-key'],
			content_type: headers['content-type'],
		};

		return {
			workflowData: [
				[
					{
						json: outputData,
					},
				],
			],
		};
	}
}
