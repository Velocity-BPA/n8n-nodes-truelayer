/**
 * @fileoverview Unit tests for validation utilities
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	validateAmount,
	validateCurrency,
	validateCountry,
	validateUuid,
	validateEmail,
	validatePhone,
	validateDate,
	validateUrl,
	validatePaymentReference,
	validateBeneficiaryName,
	toMinorUnits,
	fromMinorUnits,
} from '../../nodes/TrueLayer/utils/validationUtils';

describe('Validation Utils', () => {
	describe('validateAmount', () => {
		it('should accept positive integers', () => {
			expect(validateAmount(100)).toBe(true);
			expect(validateAmount(1)).toBe(true);
			expect(validateAmount(1000000)).toBe(true);
		});

		it('should reject zero and negative amounts', () => {
			expect(validateAmount(0)).toBe(false);
			expect(validateAmount(-1)).toBe(false);
			expect(validateAmount(-100)).toBe(false);
		});

		it('should reject non-integer amounts', () => {
			expect(validateAmount(10.5)).toBe(false);
			expect(validateAmount(100.99)).toBe(false);
		});

		it('should handle edge cases', () => {
			expect(validateAmount(NaN)).toBe(false);
			expect(validateAmount(Infinity)).toBe(false);
		});
	});

	describe('validateCurrency', () => {
		it('should accept valid ISO currency codes', () => {
			expect(validateCurrency('GBP')).toBe(true);
			expect(validateCurrency('EUR')).toBe(true);
			expect(validateCurrency('USD')).toBe(true);
			expect(validateCurrency('PLN')).toBe(true);
		});

		it('should reject invalid currency codes', () => {
			expect(validateCurrency('XXX')).toBe(false);
			expect(validateCurrency('EURO')).toBe(false);
			expect(validateCurrency('gb')).toBe(false);
			expect(validateCurrency('')).toBe(false);
		});
	});

	describe('validateCountry', () => {
		it('should accept valid ISO country codes', () => {
			expect(validateCountry('GB')).toBe(true);
			expect(validateCountry('IE')).toBe(true);
			expect(validateCountry('DE')).toBe(true);
			expect(validateCountry('FR')).toBe(true);
		});

		it('should reject invalid country codes', () => {
			expect(validateCountry('UK')).toBe(false);
			expect(validateCountry('GBR')).toBe(false);
			expect(validateCountry('gb')).toBe(false);
			expect(validateCountry('')).toBe(false);
		});
	});

	describe('validateUuid', () => {
		it('should accept valid UUIDs', () => {
			expect(validateUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
			expect(validateUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
		});

		it('should reject invalid UUIDs', () => {
			expect(validateUuid('not-a-uuid')).toBe(false);
			expect(validateUuid('550e8400-e29b-41d4-a716')).toBe(false);
			expect(validateUuid('')).toBe(false);
			expect(validateUuid('550e8400e29b41d4a716446655440000')).toBe(false);
		});
	});

	describe('validateEmail', () => {
		it('should accept valid email addresses', () => {
			expect(validateEmail('test@example.com')).toBe(true);
			expect(validateEmail('user.name@domain.co.uk')).toBe(true);
			expect(validateEmail('user+tag@example.org')).toBe(true);
		});

		it('should reject invalid email addresses', () => {
			expect(validateEmail('not-an-email')).toBe(false);
			expect(validateEmail('@example.com')).toBe(false);
			expect(validateEmail('user@')).toBe(false);
			expect(validateEmail('')).toBe(false);
		});
	});

	describe('validatePhone', () => {
		it('should accept valid phone numbers', () => {
			expect(validatePhone('+441234567890')).toBe(true);
			expect(validatePhone('+1234567890')).toBe(true);
			expect(validatePhone('+442071234567')).toBe(true);
		});

		it('should reject invalid phone numbers', () => {
			expect(validatePhone('01onal234567890')).toBe(false);
			expect(validatePhone('not-a-phone')).toBe(false);
			expect(validatePhone('')).toBe(false);
		});
	});

	describe('validateDate', () => {
		it('should accept valid ISO date strings', () => {
			expect(validateDate('2024-01-15')).toBe(true);
			expect(validateDate('2024-12-31')).toBe(true);
			expect(validateDate('2024-01-01T00:00:00Z')).toBe(true);
		});

		it('should reject invalid date strings', () => {
			expect(validateDate('not-a-date')).toBe(false);
			expect(validateDate('15-01-2024')).toBe(false);
			expect(validateDate('2024/01/15')).toBe(false);
		});
	});

	describe('validateUrl', () => {
		it('should accept valid HTTPS URLs', () => {
			expect(validateUrl('https://example.com')).toBe(true);
			expect(validateUrl('https://example.com/path')).toBe(true);
			expect(validateUrl('https://sub.example.com/path?query=1')).toBe(true);
		});

		it('should reject non-HTTPS URLs by default', () => {
			expect(validateUrl('http://example.com')).toBe(false);
			expect(validateUrl('ftp://example.com')).toBe(false);
		});

		it('should accept HTTP when allowed', () => {
			expect(validateUrl('http://example.com', true)).toBe(true);
		});
	});

	describe('validatePaymentReference', () => {
		it('should accept valid UK payment references', () => {
			expect(validatePaymentReference('Order12345', 'GB')).toBe(true);
			expect(validatePaymentReference('Payment Ref', 'GB')).toBe(true);
		});

		it('should reject too long UK references', () => {
			expect(validatePaymentReference('A'.repeat(19), 'GB')).toBe(false);
		});

		it('should accept valid SEPA references', () => {
			expect(validatePaymentReference('Order12345', 'DE')).toBe(true);
			expect(validatePaymentReference('A'.repeat(140), 'DE')).toBe(true);
		});

		it('should reject too long SEPA references', () => {
			expect(validatePaymentReference('A'.repeat(141), 'DE')).toBe(false);
		});
	});

	describe('validateBeneficiaryName', () => {
		it('should accept valid names', () => {
			expect(validateBeneficiaryName('John Doe')).toBe(true);
			expect(validateBeneficiaryName('ACME Corporation Ltd')).toBe(true);
		});

		it('should reject empty names', () => {
			expect(validateBeneficiaryName('')).toBe(false);
		});

		it('should reject too long names', () => {
			expect(validateBeneficiaryName('A'.repeat(141))).toBe(false);
		});
	});

	describe('toMinorUnits', () => {
		it('should convert major to minor units', () => {
			expect(toMinorUnits(10.00, 'GBP')).toBe(1000);
			expect(toMinorUnits(99.99, 'EUR')).toBe(9999);
			expect(toMinorUnits(1.50, 'USD')).toBe(150);
		});

		it('should handle zero decimal currencies', () => {
			// JPY has no decimal places
			expect(toMinorUnits(100, 'JPY')).toBe(100);
		});
	});

	describe('fromMinorUnits', () => {
		it('should convert minor to major units', () => {
			expect(fromMinorUnits(1000, 'GBP')).toBe(10.00);
			expect(fromMinorUnits(9999, 'EUR')).toBe(99.99);
			expect(fromMinorUnits(150, 'USD')).toBe(1.50);
		});

		it('should handle zero decimal currencies', () => {
			expect(fromMinorUnits(100, 'JPY')).toBe(100);
		});
	});
});
