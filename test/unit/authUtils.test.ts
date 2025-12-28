/**
 * @fileoverview Unit tests for authentication utilities
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	getEnvironmentUrls,
	buildOAuthUrl,
	parseScopes,
	validateScopes,
	maskCredential,
} from '../../nodes/TrueLayer/utils/authUtils';

describe('Auth Utils', () => {
	describe('getEnvironmentUrls', () => {
		it('should return production URLs for production environment', () => {
			const urls = getEnvironmentUrls('production');
			expect(urls.api).toBe('https://api.truelayer.com');
			expect(urls.auth).toBe('https://auth.truelayer.com');
			expect(urls.pay).toBe('https://pay-api.truelayer.com');
		});

		it('should return sandbox URLs for sandbox environment', () => {
			const urls = getEnvironmentUrls('sandbox');
			expect(urls.api).toBe('https://api.truelayer-sandbox.com');
			expect(urls.auth).toBe('https://auth.truelayer-sandbox.com');
			expect(urls.pay).toBe('https://pay-api.truelayer-sandbox.com');
		});

		it('should return custom URLs when provided', () => {
			const urls = getEnvironmentUrls('custom', {
				apiUrl: 'https://custom-api.example.com',
				authUrl: 'https://custom-auth.example.com',
				payUrl: 'https://custom-pay.example.com',
			});
			expect(urls.api).toBe('https://custom-api.example.com');
			expect(urls.auth).toBe('https://custom-auth.example.com');
			expect(urls.pay).toBe('https://custom-pay.example.com');
		});

		it('should default to production for unknown environment', () => {
			const urls = getEnvironmentUrls('unknown' as any);
			expect(urls.api).toBe('https://api.truelayer.com');
		});
	});

	describe('buildOAuthUrl', () => {
		it('should build correct authorization URL', () => {
			const url = buildOAuthUrl({
				clientId: 'test-client-id',
				redirectUri: 'https://example.com/callback',
				scopes: ['info', 'accounts', 'balance'],
				state: 'test-state-123',
				environment: 'sandbox',
			});

			expect(url).toContain('https://auth.truelayer-sandbox.com');
			expect(url).toContain('client_id=test-client-id');
			expect(url).toContain('redirect_uri=');
			expect(url).toContain('scope=info%20accounts%20balance');
			expect(url).toContain('state=test-state-123');
			expect(url).toContain('response_type=code');
		});

		it('should include provider_id when specified', () => {
			const url = buildOAuthUrl({
				clientId: 'test-client-id',
				redirectUri: 'https://example.com/callback',
				scopes: ['info'],
				state: 'test-state',
				environment: 'sandbox',
				providerId: 'uk-ob-barclays',
			});

			expect(url).toContain('provider_id=uk-ob-barclays');
		});

		it('should include enable_mock when specified', () => {
			const url = buildOAuthUrl({
				clientId: 'test-client-id',
				redirectUri: 'https://example.com/callback',
				scopes: ['info'],
				state: 'test-state',
				environment: 'sandbox',
				enableMock: true,
			});

			expect(url).toContain('enable_mock=true');
		});
	});

	describe('parseScopes', () => {
		it('should parse space-separated scopes', () => {
			expect(parseScopes('info accounts balance')).toEqual(['info', 'accounts', 'balance']);
		});

		it('should parse comma-separated scopes', () => {
			expect(parseScopes('info,accounts,balance')).toEqual(['info', 'accounts', 'balance']);
		});

		it('should handle array input', () => {
			expect(parseScopes(['info', 'accounts', 'balance'])).toEqual(['info', 'accounts', 'balance']);
		});

		it('should trim whitespace', () => {
			expect(parseScopes('  info  ,  accounts  ')).toEqual(['info', 'accounts']);
		});

		it('should remove empty strings', () => {
			expect(parseScopes('info,,accounts')).toEqual(['info', 'accounts']);
		});
	});

	describe('validateScopes', () => {
		it('should accept valid Data API scopes', () => {
			expect(validateScopes(['info', 'accounts', 'balance', 'transactions'])).toBe(true);
			expect(validateScopes(['cards', 'direct_debits', 'standing_orders'])).toBe(true);
			expect(validateScopes(['offline_access'])).toBe(true);
		});

		it('should reject invalid scopes', () => {
			expect(validateScopes(['invalid_scope'])).toBe(false);
			expect(validateScopes(['info', 'unknown'])).toBe(false);
		});

		it('should reject empty scopes', () => {
			expect(validateScopes([])).toBe(false);
		});
	});

	describe('maskCredential', () => {
		it('should mask long credentials', () => {
			expect(maskCredential('abcdefghijklmnop')).toBe('abcd...mnop');
		});

		it('should fully mask short credentials', () => {
			expect(maskCredential('abcd')).toBe('****');
		});

		it('should handle empty credentials', () => {
			expect(maskCredential('')).toBe('****');
		});

		it('should handle undefined', () => {
			expect(maskCredential(undefined as any)).toBe('****');
		});
	});
});
