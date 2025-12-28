/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Payment webhook event types
 */
export const PAYMENT_EVENTS = {
  paymentAuthorized: 'payment_authorized',
  paymentExecuted: 'payment_executed',
  paymentSettled: 'payment_settled',
  paymentFailed: 'payment_failed',
  paymentCancelled: 'payment_cancelled',
  paymentPending: 'payment_pending',
  paymentCreditable: 'payment_creditable',
} as const;

/**
 * Payout webhook event types
 */
export const PAYOUT_EVENTS = {
  payoutExecuted: 'payout_executed',
  payoutFailed: 'payout_failed',
  payoutPending: 'payout_pending',
} as const;

/**
 * Refund webhook event types
 */
export const REFUND_EVENTS = {
  refundExecuted: 'refund_executed',
  refundFailed: 'refund_failed',
  refundPending: 'refund_pending',
} as const;

/**
 * Mandate (VRP) webhook event types
 */
export const MANDATE_EVENTS = {
  mandateAuthorized: 'mandate_authorized',
  mandateRevoked: 'mandate_revoked',
  mandateFailed: 'mandate_failed',
  mandatePaymentExecuted: 'mandate_payment_executed',
  mandatePaymentFailed: 'mandate_payment_failed',
} as const;

/**
 * Standing order webhook event types
 */
export const STANDING_ORDER_EVENTS = {
  standingOrderCreated: 'standing_order_created',
  standingOrderExecuted: 'standing_order_executed',
  standingOrderFailed: 'standing_order_failed',
  standingOrderCancelled: 'standing_order_cancelled',
} as const;

/**
 * Merchant account webhook event types
 */
export const MERCHANT_ACCOUNT_EVENTS = {
  transactionReceived: 'merchant_account_transaction_received',
  balanceChanged: 'merchant_account_balance_changed',
  sweepExecuted: 'merchant_account_sweep_executed',
} as const;

/**
 * Consent webhook event types
 */
export const CONSENT_EVENTS = {
  consentGranted: 'consent_granted',
  consentRevoked: 'consent_revoked',
  consentExpired: 'consent_expired',
} as const;

/**
 * Verification webhook event types
 */
export const VERIFICATION_EVENTS = {
  verificationCompleted: 'verification_completed',
  verificationFailed: 'verification_failed',
} as const;

/**
 * Signup+ webhook event types
 */
export const SIGNUP_EVENTS = {
  signupStarted: 'signup_started',
  signupCompleted: 'signup_completed',
  identityVerified: 'signup_identity_verified',
} as const;

/**
 * All webhook event types combined
 */
export const ALL_WEBHOOK_EVENTS = {
  ...PAYMENT_EVENTS,
  ...PAYOUT_EVENTS,
  ...REFUND_EVENTS,
  ...MANDATE_EVENTS,
  ...STANDING_ORDER_EVENTS,
  ...MERCHANT_ACCOUNT_EVENTS,
  ...CONSENT_EVENTS,
  ...VERIFICATION_EVENTS,
  ...SIGNUP_EVENTS,
} as const;

/**
 * Event type options for n8n UI
 */
export const WEBHOOK_EVENT_OPTIONS = [
  // Payment events
  { name: 'Payment Authorized', value: 'payment_authorized' },
  { name: 'Payment Executed', value: 'payment_executed' },
  { name: 'Payment Settled', value: 'payment_settled' },
  { name: 'Payment Failed', value: 'payment_failed' },
  { name: 'Payment Cancelled', value: 'payment_cancelled' },
  { name: 'Payment Pending', value: 'payment_pending' },
  // Payout events
  { name: 'Payout Executed', value: 'payout_executed' },
  { name: 'Payout Failed', value: 'payout_failed' },
  { name: 'Payout Pending', value: 'payout_pending' },
  // Refund events
  { name: 'Refund Executed', value: 'refund_executed' },
  { name: 'Refund Failed', value: 'refund_failed' },
  { name: 'Refund Pending', value: 'refund_pending' },
  // Mandate events
  { name: 'Mandate Authorized', value: 'mandate_authorized' },
  { name: 'Mandate Revoked', value: 'mandate_revoked' },
  { name: 'Mandate Payment Executed', value: 'mandate_payment_executed' },
  { name: 'Mandate Payment Failed', value: 'mandate_payment_failed' },
  // Standing order events
  { name: 'Standing Order Created', value: 'standing_order_created' },
  { name: 'Standing Order Executed', value: 'standing_order_executed' },
  { name: 'Standing Order Failed', value: 'standing_order_failed' },
  { name: 'Standing Order Cancelled', value: 'standing_order_cancelled' },
  // Merchant account events
  { name: 'Transaction Received', value: 'merchant_account_transaction_received' },
  { name: 'Balance Changed', value: 'merchant_account_balance_changed' },
  { name: 'Sweep Executed', value: 'merchant_account_sweep_executed' },
  // Consent events
  { name: 'Consent Granted', value: 'consent_granted' },
  { name: 'Consent Revoked', value: 'consent_revoked' },
  { name: 'Consent Expired', value: 'consent_expired' },
  // Verification events
  { name: 'Verification Completed', value: 'verification_completed' },
  { name: 'Verification Failed', value: 'verification_failed' },
  // Signup events
  { name: 'Signup Started', value: 'signup_started' },
  { name: 'Signup Completed', value: 'signup_completed' },
  { name: 'Identity Verified', value: 'signup_identity_verified' },
] as const;

export type PaymentEvent = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];
export type PayoutEvent = (typeof PAYOUT_EVENTS)[keyof typeof PAYOUT_EVENTS];
export type RefundEvent = (typeof REFUND_EVENTS)[keyof typeof REFUND_EVENTS];
export type MandateEvent = (typeof MANDATE_EVENTS)[keyof typeof MANDATE_EVENTS];
export type StandingOrderEvent = (typeof STANDING_ORDER_EVENTS)[keyof typeof STANDING_ORDER_EVENTS];
export type MerchantAccountEvent =
  (typeof MERCHANT_ACCOUNT_EVENTS)[keyof typeof MERCHANT_ACCOUNT_EVENTS];
export type ConsentEvent = (typeof CONSENT_EVENTS)[keyof typeof CONSENT_EVENTS];
export type VerificationEvent = (typeof VERIFICATION_EVENTS)[keyof typeof VERIFICATION_EVENTS];
export type SignupEvent = (typeof SIGNUP_EVENTS)[keyof typeof SIGNUP_EVENTS];
export type WebhookEvent = (typeof ALL_WEBHOOK_EVENTS)[keyof typeof ALL_WEBHOOK_EVENTS];

// Alias export for backward compatibility
export const WEBHOOK_EVENT_TYPES = ALL_WEBHOOK_EVENTS;
