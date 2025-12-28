/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { CURRENCIES, COUNTRIES } from '../constants';
import { validateIban as validateIbanFromIbanUtils } from './ibanUtils';

// Re-export validateIBAN from ibanUtils for convenience
export const validateIBAN = validateIbanFromIbanUtils;

/**
 * Validation result interface
 */
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate amount format (must be positive number)
 */
export function validateAmount(amount: number | string): IValidationResult {
  const errors: string[] = [];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    errors.push('Amount must be a valid number');
  } else if (numAmount <= 0) {
    errors.push('Amount must be greater than zero');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate currency code
 */
export function validateCurrency(currency: string): IValidationResult {
  const errors: string[] = [];
  const validCurrencies = Object.values(CURRENCIES);

  if (!validCurrencies.includes(currency as any)) {
    errors.push(`Invalid currency. Valid currencies are: ${validCurrencies.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate country code
 */
export function validateCountry(country: string): IValidationResult {
  const errors: string[] = [];
  const validCountries = Object.values(COUNTRIES);

  if (!validCountries.includes(country as any)) {
    errors.push(`Invalid country code. Valid countries are: ${validCountries.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): IValidationResult {
  const errors: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    errors.push('Invalid UUID format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): IValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate phone number format (E.164)
 */
export function validatePhoneNumber(phone: string): IValidationResult {
  const errors: string[] = [];
  const phoneRegex = /^\+[1-9]\d{1,14}$/;

  if (!phoneRegex.test(phone)) {
    errors.push('Invalid phone number format. Use E.164 format (e.g., +441234567890)');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate date format (ISO 8601)
 */
export function validateDate(dateString: string): IValidationResult {
  const errors: string[] = [];
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format. Use ISO 8601 format (e.g., 2024-01-01)');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate future date
 */
export function validateFutureDate(dateString: string): IValidationResult {
  const errors: string[] = [];
  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  } else if (date <= now) {
    errors.push('Date must be in the future');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate payment reference (alphanumeric, max 18 chars for UK)
 */
export function validatePaymentReference(reference: string, country?: string): IValidationResult {
  const errors: string[] = [];

  if (!reference || reference.length === 0) {
    errors.push('Payment reference is required');
    return { isValid: false, errors };
  }

  // UK Faster Payments reference limit
  if (country === 'GB' && reference.length > 18) {
    errors.push('Payment reference must be 18 characters or less for UK payments');
  }

  // SEPA reference limit
  if (['DE', 'FR', 'ES', 'IT', 'NL'].includes(country || '') && reference.length > 140) {
    errors.push('Payment reference must be 140 characters or less for SEPA payments');
  }

  // Check for allowed characters
  const alphanumericRegex = /^[a-zA-Z0-9\s\-\.\/]+$/;
  if (!alphanumericRegex.test(reference)) {
    errors.push(
      'Payment reference contains invalid characters. Use only letters, numbers, spaces, hyphens, dots, and slashes',
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): IValidationResult {
  const errors: string[] = [];

  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate webhook URL (must be HTTPS)
 */
export function validateWebhookUrl(url: string): IValidationResult {
  const errors: string[] = [];

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      errors.push('Webhook URL must use HTTPS');
    }
  } catch {
    errors.push('Invalid URL format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate beneficiary name
 */
export function validateBeneficiaryName(name: string): IValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Beneficiary name is required');
  } else if (name.length > 140) {
    errors.push('Beneficiary name must be 140 characters or less');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate PEM private key format
 */
export function validatePrivateKey(key: string): IValidationResult {
  const errors: string[] = [];

  if (!key.includes('-----BEGIN') || !key.includes('-----END')) {
    errors.push('Invalid private key format. Must be in PEM format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Combined validation for payment request
 */
export function validatePaymentRequest(params: {
  amount: number;
  currency: string;
  beneficiaryName: string;
  reference: string;
  country?: string;
}): IValidationResult {
  const allErrors: string[] = [];

  const amountResult = validateAmount(params.amount);
  allErrors.push(...amountResult.errors);

  const currencyResult = validateCurrency(params.currency);
  allErrors.push(...currencyResult.errors);

  const nameResult = validateBeneficiaryName(params.beneficiaryName);
  allErrors.push(...nameResult.errors);

  const refResult = validatePaymentReference(params.reference, params.country);
  allErrors.push(...refResult.errors);

  return { isValid: allErrors.length === 0, errors: allErrors };
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>'"]/g, '').trim();
}

/**
 * Format amount to minor units (cents/pence)
 */
export function toMinorUnits(amount: number, currency: string): number {
  // Most currencies use 2 decimal places
  const decimalPlaces = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
  return Math.round(amount * Math.pow(10, decimalPlaces));
}

/**
 * Format amount from minor units to major units
 */
export function fromMinorUnits(amount: number, currency: string): number {
  const decimalPlaces = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
  return amount / Math.pow(10, decimalPlaces);
}

// Alias exports for backward compatibility
export const isValidUUID = (uuid: string): boolean => validateUuid(uuid).isValid;
export const isValidDate = (date: string): boolean => validateDate(date).isValid;
export const isValidEmail = (email: string): boolean => validateEmail(email).isValid;
export const isValidUrl = (url: string): boolean => validateUrl(url).isValid;
export const convertToMinorUnits = toMinorUnits;

/**
 * Validate UK sort code format
 */
export function isValidSortCode(sortCode: string): boolean {
  const clean = sortCode.replace(/[-\s]/g, '');
  return clean.length === 6 && /^\d{6}$/.test(clean);
}

/**
 * Validate UK account number
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const clean = accountNumber.replace(/\s/g, '');
  return clean.length === 8 && /^\d{8}$/.test(clean);
}
