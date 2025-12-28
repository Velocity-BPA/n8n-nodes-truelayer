/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as crypto from 'crypto';
import { IWebhookFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ALL_WEBHOOK_EVENTS } from '../constants';

/**
 * TrueLayer webhook event structure
 */
export interface ITrueLayerWebhookEvent {
  type: string;
  event_id: string;
  event_version: number;
  timestamp: string;
  body: IDataObject;
}

/**
 * Webhook signature verification result
 */
export interface IWebhookVerificationResult {
  isValid: boolean;
  error?: string;
  event?: ITrueLayerWebhookEvent;
}

/**
 * TrueLayer Webhook Handler
 * Handles webhook signature verification and event parsing
 */
export class TrueLayerWebhookHandler {
  private webhookSecret?: string;

  constructor(webhookSecret?: string) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      // If no webhook secret configured, skip verification
      // but log warning
      console.warn('[TrueLayer] Webhook signature verification skipped - no secret configured');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parse and validate webhook event
   */
  parseEvent(body: IDataObject): ITrueLayerWebhookEvent | null {
    // Validate required fields
    if (!body.type || !body.event_id) {
      return null;
    }

    return {
      type: body.type as string,
      event_id: body.event_id as string,
      event_version: (body.event_version as number) || 1,
      timestamp: (body.timestamp as string) || new Date().toISOString(),
      body: body,
    };
  }

  /**
   * Verify and parse webhook
   */
  verifyAndParse(payload: string, signature?: string): IWebhookVerificationResult {
    // Verify signature if provided
    if (signature && !this.verifySignature(payload, signature)) {
      return {
        isValid: false,
        error: 'Invalid webhook signature',
      };
    }

    try {
      const body = JSON.parse(payload);
      const event = this.parseEvent(body);

      if (!event) {
        return {
          isValid: false,
          error: 'Invalid webhook event format',
        };
      }

      return {
        isValid: true,
        event,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to parse webhook payload',
      };
    }
  }

  /**
   * Filter events by type
   */
  filterEventsByType(event: ITrueLayerWebhookEvent, allowedTypes: string[]): boolean {
    if (allowedTypes.length === 0) {
      return true; // Allow all if no filter specified
    }
    return allowedTypes.includes(event.type);
  }
}

/**
 * Process TrueLayer webhook in n8n context
 */
export async function processTrueLayerWebhook(
  this: IWebhookFunctions,
  webhookSecret?: string,
  allowedEventTypes?: string[],
): Promise<{
  workflowData: INodeExecutionData[][] | null;
}> {
  const req = this.getRequestObject();
  const handler = new TrueLayerWebhookHandler(webhookSecret);

  // Get raw body for signature verification
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // Get signature from header
  const signature = req.headers['x-tl-webhook-signature'] as string | undefined;

  // Verify and parse
  const result = handler.verifyAndParse(rawBody, signature);

  if (!result.isValid || !result.event) {
    throw new NodeOperationError(this.getNode(), result.error || 'Webhook verification failed');
  }

  // Filter by event type if specified
  if (allowedEventTypes && allowedEventTypes.length > 0) {
    if (!handler.filterEventsByType(result.event, allowedEventTypes)) {
      // Event type not in allowed list, return null to skip
      return { workflowData: null };
    }
  }

  // Return event data
  const returnData: INodeExecutionData = {
    json: {
      eventType: result.event.type,
      eventId: result.event.event_id,
      eventVersion: result.event.event_version,
      timestamp: result.event.timestamp,
      ...result.event.body,
    },
  };

  return {
    workflowData: [[returnData]],
  };
}

/**
 * Get event category from event type
 */
export function getEventCategory(eventType: string): string {
  if (eventType.startsWith('payment_')) {
    return 'payment';
  }
  if (eventType.startsWith('payout_')) {
    return 'payout';
  }
  if (eventType.startsWith('refund_')) {
    return 'refund';
  }
  if (eventType.startsWith('mandate_')) {
    return 'mandate';
  }
  if (eventType.startsWith('standing_order_')) {
    return 'standing_order';
  }
  if (eventType.startsWith('merchant_account_')) {
    return 'merchant_account';
  }
  if (eventType.startsWith('consent_')) {
    return 'consent';
  }
  if (eventType.startsWith('verification_')) {
    return 'verification';
  }
  if (eventType.startsWith('signup_')) {
    return 'signup';
  }
  return 'unknown';
}

/**
 * Validate event type is known
 */
export function isKnownEventType(eventType: string): boolean {
  return Object.values(ALL_WEBHOOK_EVENTS).includes(eventType as any);
}

/**
 * Extract resource ID from webhook event
 */
export function extractResourceId(event: ITrueLayerWebhookEvent): string | null {
  const body = event.body;

  // Check common ID fields
  const idFields = [
    'payment_id',
    'payout_id',
    'refund_id',
    'mandate_id',
    'standing_order_id',
    'merchant_account_id',
    'consent_id',
    'verification_id',
    'signup_id',
    'id',
  ];

  for (const field of idFields) {
    if (body[field]) {
      return body[field] as string;
    }
  }

  return null;
}

/**
 * Format webhook event for display
 */
export function formatWebhookEvent(event: ITrueLayerWebhookEvent): IDataObject {
  return {
    eventType: event.type,
    eventId: event.event_id,
    category: getEventCategory(event.type),
    timestamp: event.timestamp,
    resourceId: extractResourceId(event),
    data: event.body,
  };
}

/**
 * Standalone function to verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string,
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Parse webhook event from request body
 */
export function parseWebhookEvent(body: IDataObject): ITrueLayerWebhookEvent | null {
  if (!body || !body.type || !body.event_id) {
    return null;
  }

  return {
    type: body.type as string,
    event_id: body.event_id as string,
    event_version: (body.event_version as number) || 1,
    timestamp: (body.timestamp as string) || new Date().toISOString(),
    body: body,
  };
}

/**
 * Categorize event by type prefix
 */
export function categorizeEvent(eventType: string): string {
  return getEventCategory(eventType);
}
