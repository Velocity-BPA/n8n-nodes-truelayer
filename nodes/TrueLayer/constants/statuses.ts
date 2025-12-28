/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Payment statuses in TrueLayer
 * Payments go through various states during their lifecycle
 */
export const PAYMENT_STATUSES = {
  authorizationRequired: 'authorization_required',
  authorizing: 'authorizing',
  authorized: 'authorized',
  executed: 'executed',
  settled: 'settled',
  failed: 'failed',
  cancelled: 'cancelled',
  pending: 'pending',
} as const;

/**
 * Payout statuses
 */
export const PAYOUT_STATUSES = {
  pending: 'pending',
  authorized: 'authorized',
  executed: 'executed',
  failed: 'failed',
  cancelled: 'cancelled',
} as const;

/**
 * Refund statuses
 */
export const REFUND_STATUSES = {
  pending: 'pending',
  authorized: 'authorized',
  executed: 'executed',
  failed: 'failed',
} as const;

/**
 * Standing order statuses
 */
export const STANDING_ORDER_STATUSES = {
  authorizationRequired: 'authorization_required',
  authorizing: 'authorizing',
  authorized: 'authorized',
  active: 'active',
  cancelled: 'cancelled',
  failed: 'failed',
  completed: 'completed',
} as const;

/**
 * Mandate statuses (Variable Recurring Payments)
 */
export const MANDATE_STATUSES = {
  authorizationRequired: 'authorization_required',
  authorizing: 'authorizing',
  authorized: 'authorized',
  active: 'active',
  revoked: 'revoked',
  failed: 'failed',
  expired: 'expired',
} as const;

/**
 * Consent statuses for Data API
 */
export const CONSENT_STATUSES = {
  pending: 'pending',
  authorized: 'authorized',
  revoked: 'revoked',
  expired: 'expired',
  failed: 'failed',
  rejected: 'rejected',
} as const;

/**
 * Verification statuses
 */
export const VERIFICATION_STATUSES = {
  pending: 'pending',
  verified: 'verified',
  failed: 'failed',
  inconclusive: 'inconclusive',
} as const;

/**
 * Signup+ statuses
 */
export const SIGNUP_STATUSES = {
  pending: 'pending',
  started: 'started',
  completed: 'completed',
  failed: 'failed',
  abandoned: 'abandoned',
} as const;

/**
 * Webhook statuses
 */
export const WEBHOOK_STATUSES = {
  active: 'active',
  inactive: 'inactive',
  failed: 'failed',
} as const;

/**
 * Authorization flow types
 */
export const AUTH_FLOW_TYPES = {
  redirect: 'redirect',
  providerSelection: 'provider_selection',
  consent: 'consent',
  form: 'form',
  waitForOutcome: 'wait_for_outcome',
} as const;

/**
 * Payment scheme types
 */
export const SCHEME_TYPES = {
  // UK
  fasterPayments: 'faster_payments_service',
  bacs: 'bacs',
  chaps: 'chaps',
  // EU
  sepaCredit: 'sepa_credit_transfer',
  sepaInstant: 'sepa_credit_transfer_instant',
  // General
  internal: 'internal',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[keyof typeof PAYOUT_STATUSES];
export type RefundStatus = (typeof REFUND_STATUSES)[keyof typeof REFUND_STATUSES];
export type StandingOrderStatus =
  (typeof STANDING_ORDER_STATUSES)[keyof typeof STANDING_ORDER_STATUSES];
export type MandateStatus = (typeof MANDATE_STATUSES)[keyof typeof MANDATE_STATUSES];
export type ConsentStatus = (typeof CONSENT_STATUSES)[keyof typeof CONSENT_STATUSES];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[keyof typeof VERIFICATION_STATUSES];
export type SignupStatus = (typeof SIGNUP_STATUSES)[keyof typeof SIGNUP_STATUSES];
export type WebhookStatus = (typeof WEBHOOK_STATUSES)[keyof typeof WEBHOOK_STATUSES];
export type AuthFlowType = (typeof AUTH_FLOW_TYPES)[keyof typeof AUTH_FLOW_TYPES];
export type SchemeType = (typeof SCHEME_TYPES)[keyof typeof SCHEME_TYPES];
