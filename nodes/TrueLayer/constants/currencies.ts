/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Supported currencies in TrueLayer
 */
export const CURRENCIES = {
  GBP: 'GBP', // British Pound Sterling
  EUR: 'EUR', // Euro
  USD: 'USD', // US Dollar
  PLN: 'PLN', // Polish Zloty
  NOK: 'NOK', // Norwegian Krone
  SEK: 'SEK', // Swedish Krona
  DKK: 'DKK', // Danish Krone
  CHF: 'CHF', // Swiss Franc
  CZK: 'CZK', // Czech Koruna
  HUF: 'HUF', // Hungarian Forint
  RON: 'RON', // Romanian Leu
  BGN: 'BGN', // Bulgarian Lev
  HRK: 'HRK', // Croatian Kuna
} as const;

/**
 * Currency display options for n8n UI
 */
export const CURRENCY_OPTIONS = [
  { name: 'British Pound (GBP)', value: 'GBP' },
  { name: 'Euro (EUR)', value: 'EUR' },
  { name: 'US Dollar (USD)', value: 'USD' },
  { name: 'Polish Zloty (PLN)', value: 'PLN' },
  { name: 'Norwegian Krone (NOK)', value: 'NOK' },
  { name: 'Swedish Krona (SEK)', value: 'SEK' },
  { name: 'Danish Krone (DKK)', value: 'DKK' },
  { name: 'Swiss Franc (CHF)', value: 'CHF' },
  { name: 'Czech Koruna (CZK)', value: 'CZK' },
  { name: 'Hungarian Forint (HUF)', value: 'HUF' },
  { name: 'Romanian Leu (RON)', value: 'RON' },
  { name: 'Bulgarian Lev (BGN)', value: 'BGN' },
] as const;

/**
 * Supported countries for TrueLayer
 */
export const COUNTRIES = {
  GB: 'GB', // United Kingdom
  IE: 'IE', // Ireland
  DE: 'DE', // Germany
  FR: 'FR', // France
  ES: 'ES', // Spain
  IT: 'IT', // Italy
  NL: 'NL', // Netherlands
  BE: 'BE', // Belgium
  AT: 'AT', // Austria
  PT: 'PT', // Portugal
  FI: 'FI', // Finland
  PL: 'PL', // Poland
  LT: 'LT', // Lithuania
  LV: 'LV', // Latvia
  EE: 'EE', // Estonia
  NO: 'NO', // Norway
  SE: 'SE', // Sweden
  DK: 'DK', // Denmark
} as const;

/**
 * Country display options for n8n UI
 */
export const COUNTRY_OPTIONS = [
  { name: 'United Kingdom', value: 'GB' },
  { name: 'Ireland', value: 'IE' },
  { name: 'Germany', value: 'DE' },
  { name: 'France', value: 'FR' },
  { name: 'Spain', value: 'ES' },
  { name: 'Italy', value: 'IT' },
  { name: 'Netherlands', value: 'NL' },
  { name: 'Belgium', value: 'BE' },
  { name: 'Austria', value: 'AT' },
  { name: 'Portugal', value: 'PT' },
  { name: 'Finland', value: 'FI' },
  { name: 'Poland', value: 'PL' },
  { name: 'Lithuania', value: 'LT' },
  { name: 'Latvia', value: 'LV' },
  { name: 'Estonia', value: 'EE' },
  { name: 'Norway', value: 'NO' },
  { name: 'Sweden', value: 'SE' },
  { name: 'Denmark', value: 'DK' },
] as const;

/**
 * Currency to country mapping (primary currency)
 */
export const CURRENCY_COUNTRY_MAP: Record<string, string[]> = {
  GBP: ['GB'],
  EUR: ['IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'FI', 'LT', 'LV', 'EE'],
  PLN: ['PL'],
  NOK: ['NO'],
  SEK: ['SE'],
  DKK: ['DK'],
};

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];
export type Country = (typeof COUNTRIES)[keyof typeof COUNTRIES];

/**
 * Array of supported currencies for validation
 */
export const SUPPORTED_CURRENCIES = Object.values(CURRENCIES);

/**
 * Array of supported countries for validation
 */
export const SUPPORTED_COUNTRIES = Object.values(COUNTRIES);

/**
 * SEPA zone countries (excluding UK post-Brexit)
 */
export const SEPA_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'MC', 'NL', 'NO', 'PL', 'PT', 'RO', 'SM', 'SK', 'SI',
  'ES', 'SE', 'CH', 'VA',
] as const;
