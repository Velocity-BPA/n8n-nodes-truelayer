/**
 * @fileoverview Unit tests for IBAN utilities
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	validateIban,
	formatIban,
	extractBankCode,
	validateUkSortCode,
	validateUkAccountNumber,
	constructIban,
	isSepaZone,
} from '../../nodes/TrueLayer/utils/ibanUtils';

describe('IBAN Utils', () => {
	describe('validateIban', () => {
		it('should validate correct IBANs', () => {
			// UK IBAN
			expect(validateIban('GB82WEST12345698765432')).toBe(true);
			// German IBAN
			expect(validateIban('DE89370400440532013000')).toBe(true);
			// French IBAN
			expect(validateIban('FR1420041010050500013M02606')).toBe(true);
		});

		it('should accept IBANs with spaces', () => {
			expect(validateIban('GB82 WEST 1234 5698 7654 32')).toBe(true);
			expect(validateIban('DE89 3704 0044 0532 0130 00')).toBe(true);
		});

		it('should reject invalid IBANs', () => {
			// Wrong checksum
			expect(validateIban('GB00WEST12345698765432')).toBe(false);
			// Too short
			expect(validateIban('GB82')).toBe(false);
			// Invalid characters
			expect(validateIban('GB82WEST1234569876543!')).toBe(false);
		});

		it('should reject empty or invalid input', () => {
			expect(validateIban('')).toBe(false);
			expect(validateIban('not-an-iban')).toBe(false);
		});
	});

	describe('formatIban', () => {
		it('should format IBAN with spaces', () => {
			expect(formatIban('GB82WEST12345698765432')).toBe('GB82 WEST 1234 5698 7654 32');
			expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
		});

		it('should handle already formatted IBANs', () => {
			expect(formatIban('GB82 WEST 1234 5698 7654 32')).toBe('GB82 WEST 1234 5698 7654 32');
		});

		it('should uppercase the result', () => {
			expect(formatIban('gb82west12345698765432')).toBe('GB82 WEST 1234 5698 7654 32');
		});
	});

	describe('extractBankCode', () => {
		it('should extract bank code from UK IBAN', () => {
			expect(extractBankCode('GB82WEST12345698765432')).toBe('WEST');
		});

		it('should extract bank code from German IBAN', () => {
			expect(extractBankCode('DE89370400440532013000')).toBe('37040044');
		});

		it('should handle IBANs with spaces', () => {
			expect(extractBankCode('GB82 WEST 1234 5698 7654 32')).toBe('WEST');
		});
	});

	describe('validateUkSortCode', () => {
		it('should accept valid sort codes', () => {
			expect(validateUkSortCode('040004')).toBe(true);
			expect(validateUkSortCode('12-34-56')).toBe(true);
			expect(validateUkSortCode('00-00-01')).toBe(true);
		});

		it('should reject invalid sort codes', () => {
			expect(validateUkSortCode('12345')).toBe(false);
			expect(validateUkSortCode('1234567')).toBe(false);
			expect(validateUkSortCode('abcdef')).toBe(false);
			expect(validateUkSortCode('')).toBe(false);
		});
	});

	describe('validateUkAccountNumber', () => {
		it('should accept valid account numbers', () => {
			expect(validateUkAccountNumber('12345678')).toBe(true);
			expect(validateUkAccountNumber('00000001')).toBe(true);
		});

		it('should reject invalid account numbers', () => {
			expect(validateUkAccountNumber('1234567')).toBe(false);
			expect(validateUkAccountNumber('123456789')).toBe(false);
			expect(validateUkAccountNumber('abcdefgh')).toBe(false);
			expect(validateUkAccountNumber('')).toBe(false);
		});
	});

	describe('constructIban', () => {
		it('should construct UK IBAN from sort code and account number', () => {
			const iban = constructIban('GB', '040004', '12345678');
			expect(iban).toMatch(/^GB\d{2}[A-Z]{4}\d{14}$/);
		});

		it('should construct German IBAN', () => {
			const iban = constructIban('DE', '37040044', '0532013000');
			expect(iban).toMatch(/^DE\d{20}$/);
		});
	});

	describe('isSepaZone', () => {
		it('should identify SEPA countries', () => {
			expect(isSepaZone('DE')).toBe(true);
			expect(isSepaZone('FR')).toBe(true);
			expect(isSepaZone('ES')).toBe(true);
			expect(isSepaZone('IT')).toBe(true);
			expect(isSepaZone('NL')).toBe(true);
		});

		it('should identify non-SEPA countries', () => {
			expect(isSepaZone('US')).toBe(false);
			expect(isSepaZone('JP')).toBe(false);
			expect(isSepaZone('AU')).toBe(false);
		});

		it('should identify UK as special case', () => {
			// UK is technically not SEPA since Brexit but may have arrangements
			expect(isSepaZone('GB')).toBe(false);
		});
	});
});
