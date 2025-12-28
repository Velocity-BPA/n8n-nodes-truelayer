/**
 * @fileoverview Unit tests for signing utilities
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	generateIdempotencyKey,
	generateNonce,
	generateState,
	calculateDigest,
} from '../../nodes/TrueLayer/utils/signingUtils';

describe('Signing Utils', () => {
	describe('generateIdempotencyKey', () => {
		it('should generate a valid UUID v4', () => {
			const key = generateIdempotencyKey();
			expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should generate unique keys', () => {
			const key1 = generateIdempotencyKey();
			const key2 = generateIdempotencyKey();
			expect(key1).not.toBe(key2);
		});
	});

	describe('generateNonce', () => {
		it('should generate a string of specified length', () => {
			const nonce = generateNonce(32);
			expect(nonce.length).toBe(32);
		});

		it('should generate alphanumeric characters', () => {
			const nonce = generateNonce(100);
			expect(nonce).toMatch(/^[a-zA-Z0-9]+$/);
		});

		it('should generate unique nonces', () => {
			const nonce1 = generateNonce(32);
			const nonce2 = generateNonce(32);
			expect(nonce1).not.toBe(nonce2);
		});
	});

	describe('generateState', () => {
		it('should generate a URL-safe string', () => {
			const state = generateState();
			expect(state).toMatch(/^[a-zA-Z0-9_-]+$/);
		});

		it('should be of reasonable length', () => {
			const state = generateState();
			expect(state.length).toBeGreaterThan(16);
			expect(state.length).toBeLessThan(64);
		});

		it('should generate unique states', () => {
			const state1 = generateState();
			const state2 = generateState();
			expect(state1).not.toBe(state2);
		});
	});

	describe('calculateDigest', () => {
		it('should calculate SHA-512 digest of string body', () => {
			const body = '{"amount":1000,"currency":"GBP"}';
			const digest = calculateDigest(body);
			expect(digest).toMatch(/^[a-f0-9]{128}$/);
		});

		it('should calculate consistent digests', () => {
			const body = '{"test":"data"}';
			const digest1 = calculateDigest(body);
			const digest2 = calculateDigest(body);
			expect(digest1).toBe(digest2);
		});

		it('should calculate different digests for different bodies', () => {
			const digest1 = calculateDigest('{"a":1}');
			const digest2 = calculateDigest('{"a":2}');
			expect(digest1).not.toBe(digest2);
		});

		it('should handle empty body', () => {
			const digest = calculateDigest('');
			expect(digest).toMatch(/^[a-f0-9]{128}$/);
		});

		it('should handle object body', () => {
			const body = { amount: 1000, currency: 'GBP' };
			const digest = calculateDigest(body);
			expect(digest).toMatch(/^[a-f0-9]{128}$/);
		});
	});
});
