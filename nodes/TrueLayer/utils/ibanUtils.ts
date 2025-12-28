/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * IBAN validation and utility functions
 * Used for validating bank account details in TrueLayer payments
 */

/**
 * IBAN country lengths (ISO 13616)
 */
const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, // Andorra
  AT: 20, // Austria
  BE: 16, // Belgium
  BG: 22, // Bulgaria
  CH: 21, // Switzerland
  CY: 28, // Cyprus
  CZ: 24, // Czech Republic
  DE: 22, // Germany
  DK: 18, // Denmark
  EE: 20, // Estonia
  ES: 24, // Spain
  FI: 18, // Finland
  FR: 27, // France
  GB: 22, // United Kingdom
  GI: 23, // Gibraltar
  GR: 27, // Greece
  HR: 21, // Croatia
  HU: 28, // Hungary
  IE: 22, // Ireland
  IT: 27, // Italy
  LI: 21, // Liechtenstein
  LT: 20, // Lithuania
  LU: 20, // Luxembourg
  LV: 21, // Latvia
  MC: 27, // Monaco
  MT: 31, // Malta
  NL: 18, // Netherlands
  NO: 15, // Norway
  PL: 28, // Poland
  PT: 25, // Portugal
  RO: 24, // Romania
  SE: 24, // Sweden
  SI: 19, // Slovenia
  SK: 24, // Slovakia
};

/**
 * Validate IBAN checksum using MOD-97 algorithm
 */
export function validateIban(iban: string): {
  isValid: boolean;
  error?: string;
  countryCode?: string;
  checkDigits?: string;
  bban?: string;
} {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Check minimum length
  if (cleanIban.length < 15) {
    return { isValid: false, error: 'IBAN is too short' };
  }

  // Extract country code
  const countryCode = cleanIban.substring(0, 2);

  // Check if country is supported
  const expectedLength = IBAN_LENGTHS[countryCode];
  if (!expectedLength) {
    return { isValid: false, error: `Unsupported country code: ${countryCode}` };
  }

  // Check length for country
  if (cleanIban.length !== expectedLength) {
    return {
      isValid: false,
      error: `Invalid length for ${countryCode}. Expected ${expectedLength}, got ${cleanIban.length}`,
    };
  }

  // Check characters (alphanumeric only)
  if (!/^[A-Z0-9]+$/.test(cleanIban)) {
    return { isValid: false, error: 'IBAN contains invalid characters' };
  }

  // Rearrange for checksum (move first 4 chars to end)
  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  let numeric = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }

  // Calculate MOD-97
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i], 10)) % 97;
  }

  if (remainder !== 1) {
    return { isValid: false, error: 'Invalid IBAN checksum' };
  }

  return {
    isValid: true,
    countryCode,
    checkDigits: cleanIban.substring(2, 4),
    bban: cleanIban.substring(4),
  };
}

/**
 * Format IBAN with spaces for display
 */
export function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Extract bank identifier from IBAN (country-specific)
 */
export function extractBankCode(iban: string): string | null {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  const countryCode = clean.substring(0, 2);

  // Bank code positions vary by country
  const bankCodePositions: Record<string, [number, number]> = {
    GB: [4, 8], // UK: 4 chars
    DE: [4, 12], // Germany: 8 chars
    FR: [4, 9], // France: 5 chars
    ES: [4, 8], // Spain: 4 chars
    IT: [5, 10], // Italy: 5 chars (after check char)
    NL: [4, 8], // Netherlands: 4 chars
  };

  const positions = bankCodePositions[countryCode];
  if (positions) {
    return clean.substring(positions[0], positions[1]);
  }

  return null;
}

/**
 * Validate UK sort code format
 */
export function validateSortCode(sortCode: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  // Remove any hyphens or spaces
  const clean = sortCode.replace(/[-\s]/g, '');

  // Check length
  if (clean.length !== 6) {
    return { isValid: false, error: 'Sort code must be 6 digits' };
  }

  // Check if all digits
  if (!/^\d{6}$/.test(clean)) {
    return { isValid: false, error: 'Sort code must contain only digits' };
  }

  // Format as XX-XX-XX
  const formatted = `${clean.substring(0, 2)}-${clean.substring(2, 4)}-${clean.substring(4, 6)}`;

  return { isValid: true, formatted };
}

/**
 * Validate UK account number
 */
export function validateUkAccountNumber(accountNumber: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  // Remove any spaces
  const clean = accountNumber.replace(/\s/g, '');

  // Check length (8 digits for UK)
  if (clean.length !== 8) {
    return { isValid: false, error: 'UK account number must be 8 digits' };
  }

  // Check if all digits
  if (!/^\d{8}$/.test(clean)) {
    return { isValid: false, error: 'Account number must contain only digits' };
  }

  return { isValid: true, formatted: clean };
}

/**
 * Build IBAN from UK sort code and account number
 */
export function buildUkIban(sortCode: string, accountNumber: string): string | null {
  const sortCodeResult = validateSortCode(sortCode);
  const accountResult = validateUkAccountNumber(accountNumber);

  if (!sortCodeResult.isValid || !accountResult.isValid) {
    return null;
  }

  const cleanSortCode = sortCode.replace(/[-\s]/g, '');
  const cleanAccount = accountNumber.replace(/\s/g, '');

  // UK IBAN: GB + check digits + bank code (4) + sort code (6) + account (8)
  // Bank code for UK is typically derived from sort code
  const bankCode = 'NWBK'; // Example - in reality would need lookup

  // Calculate check digits
  const bban = bankCode + cleanSortCode + cleanAccount;
  const rearranged = bban + 'GB00';

  let numeric = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }

  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i], 10)) % 97;
  }

  const checkDigits = (98 - remainder).toString().padStart(2, '0');

  return `GB${checkDigits}${bban}`;
}

/**
 * Get country from IBAN
 */
export function getCountryFromIban(iban: string): string | null {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 2) return null;

  const countryCode = clean.substring(0, 2);
  return IBAN_LENGTHS[countryCode] ? countryCode : null;
}

/**
 * Check if IBAN is from SEPA zone
 */
export function isSepaIban(iban: string): boolean {
  const sepaCountries = [
    'AT',
    'BE',
    'BG',
    'CH',
    'CY',
    'CZ',
    'DE',
    'DK',
    'EE',
    'ES',
    'FI',
    'FR',
    'GB',
    'GI',
    'GR',
    'HR',
    'HU',
    'IE',
    'IT',
    'LI',
    'LT',
    'LU',
    'LV',
    'MC',
    'MT',
    'NL',
    'NO',
    'PL',
    'PT',
    'RO',
    'SE',
    'SI',
    'SK',
  ];

  const country = getCountryFromIban(iban);
  return country ? sepaCountries.includes(country) : false;
}

// Alias exports for backward compatibility
export const validateIBAN = validateIban;
export const formatIBAN = formatIban;
export const extractBankCodeFromIBAN = extractBankCode;
export const isValidSortCode = (sortCode: string): boolean => validateSortCode(sortCode).isValid;
export const isValidAccountNumber = (accountNumber: string): boolean =>
  validateUkAccountNumber(accountNumber).isValid;
