/**
 * @fileoverview Unit tests for constants
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	ENDPOINTS,
	OAUTH_SCOPES,
} from '../../nodes/TrueLayer/constants/endpoints';

import {
	SUPPORTED_CURRENCIES,
	SUPPORTED_COUNTRIES,
	SEPA_COUNTRIES,
} from '../../nodes/TrueLayer/constants/currencies';

import {
	PAYMENT_STATUSES,
	PAYOUT_STATUSES,
	MANDATE_STATUSES,
	CONSENT_STATUSES,
} from '../../nodes/TrueLayer/constants/statuses';

import {
	UK_PROVIDERS,
	EU_PROVIDERS,
	SANDBOX_PROVIDERS,
} from '../../nodes/TrueLayer/constants/providers';

import {
	PAYMENT_EVENTS,
	PAYOUT_EVENTS,
	REFUND_EVENTS,
	MANDATE_EVENTS,
} from '../../nodes/TrueLayer/constants/eventTypes';

describe('Constants', () => {
	describe('Endpoints', () => {
		it('should have production endpoints', () => {
			expect(ENDPOINTS.PRODUCTION.API).toBe('https://api.truelayer.com');
			expect(ENDPOINTS.PRODUCTION.AUTH).toBe('https://auth.truelayer.com');
			expect(ENDPOINTS.PRODUCTION.PAY).toBe('https://pay-api.truelayer.com');
		});

		it('should have sandbox endpoints', () => {
			expect(ENDPOINTS.SANDBOX.API).toBe('https://api.truelayer-sandbox.com');
			expect(ENDPOINTS.SANDBOX.AUTH).toBe('https://auth.truelayer-sandbox.com');
			expect(ENDPOINTS.SANDBOX.PAY).toBe('https://pay-api.truelayer-sandbox.com');
		});
	});

	describe('OAuth Scopes', () => {
		it('should have all required Data API scopes', () => {
			expect(OAUTH_SCOPES).toContain('info');
			expect(OAUTH_SCOPES).toContain('accounts');
			expect(OAUTH_SCOPES).toContain('balance');
			expect(OAUTH_SCOPES).toContain('transactions');
			expect(OAUTH_SCOPES).toContain('cards');
			expect(OAUTH_SCOPES).toContain('direct_debits');
			expect(OAUTH_SCOPES).toContain('standing_orders');
			expect(OAUTH_SCOPES).toContain('offline_access');
		});
	});

	describe('Currencies', () => {
		it('should include major currencies', () => {
			expect(SUPPORTED_CURRENCIES).toContain('GBP');
			expect(SUPPORTED_CURRENCIES).toContain('EUR');
			expect(SUPPORTED_CURRENCIES).toContain('USD');
		});

		it('should include European currencies', () => {
			expect(SUPPORTED_CURRENCIES).toContain('PLN');
			expect(SUPPORTED_CURRENCIES).toContain('NOK');
			expect(SUPPORTED_CURRENCIES).toContain('SEK');
			expect(SUPPORTED_CURRENCIES).toContain('DKK');
			expect(SUPPORTED_CURRENCIES).toContain('CHF');
		});
	});

	describe('Countries', () => {
		it('should include UK', () => {
			expect(SUPPORTED_COUNTRIES).toContain('GB');
		});

		it('should include major EU countries', () => {
			expect(SUPPORTED_COUNTRIES).toContain('DE');
			expect(SUPPORTED_COUNTRIES).toContain('FR');
			expect(SUPPORTED_COUNTRIES).toContain('ES');
			expect(SUPPORTED_COUNTRIES).toContain('IT');
			expect(SUPPORTED_COUNTRIES).toContain('NL');
		});

		it('should have SEPA countries subset', () => {
			expect(SEPA_COUNTRIES.length).toBeGreaterThan(0);
			SEPA_COUNTRIES.forEach(country => {
				expect(SUPPORTED_COUNTRIES).toContain(country);
			});
		});
	});

	describe('Payment Statuses', () => {
		it('should have all payment status values', () => {
			expect(PAYMENT_STATUSES).toContain('authorization_required');
			expect(PAYMENT_STATUSES).toContain('authorizing');
			expect(PAYMENT_STATUSES).toContain('authorized');
			expect(PAYMENT_STATUSES).toContain('executed');
			expect(PAYMENT_STATUSES).toContain('settled');
			expect(PAYMENT_STATUSES).toContain('failed');
		});
	});

	describe('Payout Statuses', () => {
		it('should have all payout status values', () => {
			expect(PAYOUT_STATUSES).toContain('pending');
			expect(PAYOUT_STATUSES).toContain('authorized');
			expect(PAYOUT_STATUSES).toContain('executed');
			expect(PAYOUT_STATUSES).toContain('failed');
		});
	});

	describe('Mandate Statuses', () => {
		it('should have all mandate status values', () => {
			expect(MANDATE_STATUSES).toContain('authorization_required');
			expect(MANDATE_STATUSES).toContain('authorizing');
			expect(MANDATE_STATUSES).toContain('authorized');
			expect(MANDATE_STATUSES).toContain('revoked');
			expect(MANDATE_STATUSES).toContain('failed');
		});
	});

	describe('Consent Statuses', () => {
		it('should have all consent status values', () => {
			expect(CONSENT_STATUSES).toContain('pending');
			expect(CONSENT_STATUSES).toContain('granted');
			expect(CONSENT_STATUSES).toContain('revoked');
			expect(CONSENT_STATUSES).toContain('expired');
		});
	});

	describe('UK Providers', () => {
		it('should include major UK banks', () => {
			const providerIds = UK_PROVIDERS.map(p => p.id);
			expect(providerIds).toContain('uk-ob-barclays');
			expect(providerIds).toContain('uk-ob-hsbc');
			expect(providerIds).toContain('uk-ob-lloyds');
			expect(providerIds).toContain('uk-ob-natwest');
		});

		it('should include UK digital banks', () => {
			const providerIds = UK_PROVIDERS.map(p => p.id);
			expect(providerIds).toContain('uk-ob-monzo');
			expect(providerIds).toContain('uk-ob-starling');
			expect(providerIds).toContain('uk-ob-revolut');
		});
	});

	describe('EU Providers', () => {
		it('should have EU providers defined', () => {
			expect(EU_PROVIDERS.length).toBeGreaterThan(0);
		});

		it('should have country codes for EU providers', () => {
			EU_PROVIDERS.forEach(provider => {
				expect(provider.country).toBeDefined();
				expect(provider.country.length).toBe(2);
			});
		});
	});

	describe('Sandbox Providers', () => {
		it('should have mock bank for testing', () => {
			const providerIds = SANDBOX_PROVIDERS.map(p => p.id);
			expect(providerIds).toContain('mock-payments-gb-redirect');
		});
	});

	describe('Payment Events', () => {
		it('should have all payment event types', () => {
			expect(PAYMENT_EVENTS).toContain('payment_authorized');
			expect(PAYMENT_EVENTS).toContain('payment_executed');
			expect(PAYMENT_EVENTS).toContain('payment_settled');
			expect(PAYMENT_EVENTS).toContain('payment_failed');
		});
	});

	describe('Payout Events', () => {
		it('should have all payout event types', () => {
			expect(PAYOUT_EVENTS).toContain('payout_executed');
			expect(PAYOUT_EVENTS).toContain('payout_failed');
		});
	});

	describe('Refund Events', () => {
		it('should have all refund event types', () => {
			expect(REFUND_EVENTS).toContain('refund_executed');
			expect(REFUND_EVENTS).toContain('refund_failed');
		});
	});

	describe('Mandate Events', () => {
		it('should have all mandate event types', () => {
			expect(MANDATE_EVENTS).toContain('mandate_authorized');
			expect(MANDATE_EVENTS).toContain('mandate_revoked');
		});
	});
});
