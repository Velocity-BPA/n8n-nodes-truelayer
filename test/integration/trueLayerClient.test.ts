/**
 * @fileoverview Integration tests for TrueLayer client
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 * 
 * These tests require valid TrueLayer sandbox credentials.
 * Set the following environment variables:
 * - TRUELAYER_CLIENT_ID
 * - TRUELAYER_CLIENT_SECRET
 * - TRUELAYER_SIGNING_KEY_ID
 * - TRUELAYER_PRIVATE_KEY
 */

import { TrueLayerClient } from '../../nodes/TrueLayer/transport/trueLayerClient';

// Skip integration tests if credentials are not available
const hasCredentials = !!(
	process.env.TRUELAYER_CLIENT_ID &&
	process.env.TRUELAYER_CLIENT_SECRET
);

const describeWithCredentials = hasCredentials ? describe : describe.skip;

describeWithCredentials('TrueLayer Client Integration', () => {
	let client: TrueLayerClient;

	beforeAll(() => {
		client = new TrueLayerClient({
			environment: 'sandbox',
			clientId: process.env.TRUELAYER_CLIENT_ID!,
			clientSecret: process.env.TRUELAYER_CLIENT_SECRET!,
			signingKeyId: process.env.TRUELAYER_SIGNING_KEY_ID,
			privateKey: process.env.TRUELAYER_PRIVATE_KEY,
		});
	});

	describe('Authentication', () => {
		it('should obtain access token', async () => {
			const token = await client.getAccessToken();
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});

		it('should cache access token', async () => {
			const token1 = await client.getAccessToken();
			const token2 = await client.getAccessToken();
			expect(token1).toBe(token2);
		});
	});

	describe('Providers API', () => {
		it('should list available providers', async () => {
			const response = await client.get('/v3/providers');
			expect(response).toBeDefined();
			expect(Array.isArray(response.results || response)).toBe(true);
		});

		it('should get provider by ID', async () => {
			const response = await client.get('/v3/providers/mock-payments-gb-redirect');
			expect(response).toBeDefined();
			expect(response.id || response.provider_id).toBeDefined();
		});
	});

	describe('Merchant Accounts API', () => {
		it('should list merchant accounts', async () => {
			try {
				const response = await client.get('/v3/merchant-accounts');
				expect(response).toBeDefined();
			} catch (error: any) {
				// 403 is expected if not configured for payouts
				if (error.statusCode !== 403) {
					throw error;
				}
			}
		});
	});

	describe('Error Handling', () => {
		it('should handle 404 errors gracefully', async () => {
			try {
				await client.get('/v3/payments/non-existent-payment-id');
				fail('Expected error to be thrown');
			} catch (error: any) {
				expect(error.statusCode).toBe(404);
			}
		});

		it('should handle invalid endpoints', async () => {
			try {
				await client.get('/v3/invalid-endpoint');
				fail('Expected error to be thrown');
			} catch (error: any) {
				expect([400, 404]).toContain(error.statusCode);
			}
		});
	});
});

describeWithCredentials('TrueLayer OAuth Integration', () => {
	describe('Authorization URL', () => {
		it('should build valid authorization URL', () => {
			const { buildOAuthUrl } = require('../../nodes/TrueLayer/utils/authUtils');
			
			const url = buildOAuthUrl({
				clientId: process.env.TRUELAYER_CLIENT_ID!,
				redirectUri: 'https://example.com/callback',
				scopes: ['info', 'accounts', 'balance'],
				state: 'test-state',
				environment: 'sandbox',
				enableMock: true,
			});

			expect(url).toContain('auth.truelayer-sandbox.com');
			expect(url).toContain('client_id=' + process.env.TRUELAYER_CLIENT_ID);
			expect(url).toContain('enable_mock=true');
		});
	});
});

// Mock integration test that doesn't require credentials
describe('TrueLayer Client (Mocked)', () => {
	it('should construct with valid config', () => {
		const mockConfig = {
			environment: 'sandbox' as const,
			clientId: 'mock-client-id',
			clientSecret: 'mock-client-secret',
		};

		expect(() => new TrueLayerClient(mockConfig)).not.toThrow();
	});

	it('should throw on missing required config', () => {
		expect(() => new TrueLayerClient({
			environment: 'sandbox',
			clientId: '',
			clientSecret: '',
		})).toThrow();
	});
});
