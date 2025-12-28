/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Common UK bank provider IDs
 * These are the provider identifiers used in TrueLayer API
 */
export const UK_PROVIDERS = {
  barclays: 'ob-barclays',
  hsbc: 'ob-hsbc',
  lloyds: 'ob-lloyds',
  natwest: 'ob-natwest',
  santander: 'ob-santander',
  rbs: 'ob-rbs',
  halifax: 'ob-halifax',
  tsb: 'ob-tsb',
  nationwide: 'ob-nationwide',
  monzo: 'ob-monzo',
  starling: 'ob-starling',
  revolut: 'ob-revolut',
  metro: 'ob-metro',
  first_direct: 'ob-first-direct',
  coop: 'ob-coop',
  virginMoney: 'ob-virgin-money',
  tesco: 'ob-tesco',
  ulster: 'ob-ulster',
  bankOfScotland: 'ob-bank-of-scotland',
  clydesdale: 'ob-clydesdale',
} as const;

/**
 * Common EU bank provider IDs
 */
export const EU_PROVIDERS = {
  // Germany
  deutscheBank: 'de-deutsche-bank',
  commerzbank: 'de-commerzbank',
  n26: 'de-n26',

  // France
  bnpParibas: 'fr-bnp-paribas',
  creditAgricole: 'fr-credit-agricole',
  societyGenerale: 'fr-societe-generale',

  // Spain
  santanderEs: 'es-santander',
  bbva: 'es-bbva',
  caixabank: 'es-caixabank',

  // Italy
  unicredit: 'it-unicredit',
  intesaSanpaolo: 'it-intesa-sanpaolo',

  // Netherlands
  ing: 'nl-ing',
  rabobank: 'nl-rabobank',
  abn_amro: 'nl-abn-amro',

  // Ireland
  aib: 'ie-aib',
  bankOfIreland: 'ie-bank-of-ireland',
  ptsb: 'ie-ptsb',
} as const;

/**
 * Provider capabilities
 */
export const PROVIDER_CAPABILITIES = {
  payments: 'payments',
  payouts: 'payouts',
  vrp: 'variable_recurring_payments',
  standingOrders: 'standing_orders',
  accounts: 'accounts',
  balance: 'balance',
  transactions: 'transactions',
  directDebits: 'direct_debits',
  beneficiaries: 'beneficiaries',
  identity: 'identity',
} as const;

/**
 * Provider types/categories
 */
export const PROVIDER_TYPES = {
  retail: 'retail',
  business: 'business',
  corporate: 'corporate',
  wealth: 'wealth',
} as const;

/**
 * Sandbox test providers for development
 */
export const SANDBOX_PROVIDERS = {
  mock: 'mock-payments-gb-redirect',
  mockOAuth: 'mock-payments-oauth',
  mockEmbedded: 'mock-payments-embedded',
} as const;

/**
 * Provider options for n8n UI dropdown
 */
export const UK_PROVIDER_OPTIONS = [
  { name: 'Barclays', value: 'ob-barclays' },
  { name: 'HSBC', value: 'ob-hsbc' },
  { name: 'Lloyds', value: 'ob-lloyds' },
  { name: 'NatWest', value: 'ob-natwest' },
  { name: 'Santander UK', value: 'ob-santander' },
  { name: 'Royal Bank of Scotland', value: 'ob-rbs' },
  { name: 'Halifax', value: 'ob-halifax' },
  { name: 'TSB', value: 'ob-tsb' },
  { name: 'Nationwide', value: 'ob-nationwide' },
  { name: 'Monzo', value: 'ob-monzo' },
  { name: 'Starling Bank', value: 'ob-starling' },
  { name: 'Revolut', value: 'ob-revolut' },
  { name: 'Metro Bank', value: 'ob-metro' },
  { name: 'First Direct', value: 'ob-first-direct' },
  { name: 'Co-operative Bank', value: 'ob-coop' },
  { name: 'Virgin Money', value: 'ob-virgin-money' },
  { name: 'Tesco Bank', value: 'ob-tesco' },
] as const;

export type UkProvider = (typeof UK_PROVIDERS)[keyof typeof UK_PROVIDERS];
export type EuProvider = (typeof EU_PROVIDERS)[keyof typeof EU_PROVIDERS];
export type ProviderCapability = (typeof PROVIDER_CAPABILITIES)[keyof typeof PROVIDER_CAPABILITIES];
export type ProviderType = (typeof PROVIDER_TYPES)[keyof typeof PROVIDER_TYPES];
