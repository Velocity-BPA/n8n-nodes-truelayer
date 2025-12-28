/**
 * @fileoverview Unit tests for webhook handler
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	verifyWebhookSignature,
	parseWebhookEvent,
	filterEvents,
	extractResourceId,
	categorizeEvent,
} from '../../nodes/TrueLayer/transport/webhookHandler';

describe('Webhook Handler', () => {
	const testSecret = 'test-webhook-secret-123';

	describe('verifyWebhookSignature', () => {
		it('should verify valid HMAC signature', () => {
			const body = '{"type":"payment_executed","payment_id":"pay-123"}';
			// Pre-calculated HMAC-SHA256 for test
			const crypto = require('crypto');
			const signature = crypto
				.createHmac('sha256', testSecret)
				.update(body)
				.digest('hex');

			expect(verifyWebhookSignature(body, signature, testSecret)).toBe(true);
		});

		it('should reject invalid signature', () => {
			const body = '{"type":"payment_executed","payment_id":"pay-123"}';
			const invalidSignature = 'invalid-signature';

			expect(verifyWebhookSignature(body, invalidSignature, testSecret)).toBe(false);
		});

		it('should reject modified body', () => {
			const originalBody = '{"type":"payment_executed","payment_id":"pay-123"}';
			const modifiedBody = '{"type":"payment_executed","payment_id":"pay-456"}';
			const crypto = require('crypto');
			const signature = crypto
				.createHmac('sha256', testSecret)
				.update(originalBody)
				.digest('hex');

			expect(verifyWebhookSignature(modifiedBody, signature, testSecret)).toBe(false);
		});

		it('should handle empty inputs gracefully', () => {
			expect(verifyWebhookSignature('', '', testSecret)).toBe(false);
			expect(verifyWebhookSignature('body', '', testSecret)).toBe(false);
		});
	});

	describe('parseWebhookEvent', () => {
		it('should parse valid webhook event', () => {
			const body = JSON.stringify({
				type: 'payment_executed',
				payment_id: 'pay-123',
				executed_at: '2024-01-15T10:30:00Z',
			});

			const event = parseWebhookEvent(body);
			expect(event.type).toBe('payment_executed');
			expect(event.payment_id).toBe('pay-123');
		});

		it('should throw on invalid JSON', () => {
			expect(() => parseWebhookEvent('not-json')).toThrow();
		});

		it('should throw on missing type', () => {
			const body = JSON.stringify({ payment_id: 'pay-123' });
			expect(() => parseWebhookEvent(body)).toThrow();
		});
	});

	describe('filterEvents', () => {
		const events = [
			{ type: 'payment_executed', payment_id: 'pay-1' },
			{ type: 'payment_failed', payment_id: 'pay-2' },
			{ type: 'payout_executed', payout_id: 'pout-1' },
			{ type: 'mandate_authorized', mandate_id: 'mnd-1' },
		];

		it('should filter by single event type', () => {
			const filtered = filterEvents(events, ['payment_executed']);
			expect(filtered).toHaveLength(1);
			expect(filtered[0].type).toBe('payment_executed');
		});

		it('should filter by multiple event types', () => {
			const filtered = filterEvents(events, ['payment_executed', 'payment_failed']);
			expect(filtered).toHaveLength(2);
		});

		it('should return all events when filter is empty', () => {
			const filtered = filterEvents(events, []);
			expect(filtered).toHaveLength(4);
		});

		it('should return empty array when no matches', () => {
			const filtered = filterEvents(events, ['unknown_event']);
			expect(filtered).toHaveLength(0);
		});
	});

	describe('extractResourceId', () => {
		it('should extract payment_id', () => {
			const event = { type: 'payment_executed', payment_id: 'pay-123' };
			expect(extractResourceId(event)).toBe('pay-123');
		});

		it('should extract payout_id', () => {
			const event = { type: 'payout_executed', payout_id: 'pout-123' };
			expect(extractResourceId(event)).toBe('pout-123');
		});

		it('should extract mandate_id', () => {
			const event = { type: 'mandate_authorized', mandate_id: 'mnd-123' };
			expect(extractResourceId(event)).toBe('mnd-123');
		});

		it('should extract refund_id', () => {
			const event = { type: 'refund_executed', refund_id: 'ref-123' };
			expect(extractResourceId(event)).toBe('ref-123');
		});

		it('should return undefined for unknown event type', () => {
			const event = { type: 'unknown_event' };
			expect(extractResourceId(event)).toBeUndefined();
		});
	});

	describe('categorizeEvent', () => {
		it('should categorize payment events', () => {
			expect(categorizeEvent('payment_executed')).toBe('payment');
			expect(categorizeEvent('payment_failed')).toBe('payment');
			expect(categorizeEvent('payment_settled')).toBe('payment');
		});

		it('should categorize payout events', () => {
			expect(categorizeEvent('payout_executed')).toBe('payout');
			expect(categorizeEvent('payout_failed')).toBe('payout');
		});

		it('should categorize refund events', () => {
			expect(categorizeEvent('refund_executed')).toBe('refund');
			expect(categorizeEvent('refund_failed')).toBe('refund');
		});

		it('should categorize mandate events', () => {
			expect(categorizeEvent('mandate_authorized')).toBe('mandate');
			expect(categorizeEvent('mandate_revoked')).toBe('mandate');
		});

		it('should return unknown for unrecognized events', () => {
			expect(categorizeEvent('some_unknown_event')).toBe('unknown');
		});
	});
});
