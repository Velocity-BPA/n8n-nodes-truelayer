// @ts-nocheck
/**
 * TrueLayer Reporting Resource
 * Payment, payout, and reconciliation reports
 *
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import { TrueLayerClient } from '../../transport/trueLayerClient';
import { isValidUUID, isValidDate } from '../../utils/validationUtils';
import { ENDPOINTS } from '../../constants/endpoints';
import { SUPPORTED_CURRENCIES } from '../../constants/currencies';

export const reportingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
			},
		},
		options: [
			{
				name: 'Export Report',
				value: 'export',
				description: 'Export a report in a specific format',
				action: 'Export report',
			},
			{
				name: 'Get Merchant Report',
				value: 'getMerchantReport',
				description: 'Get merchant account report',
				action: 'Get merchant report',
			},
			{
				name: 'Get Payment Report',
				value: 'getPaymentReport',
				description: 'Get payment report for a date range',
				action: 'Get payment report',
			},
			{
				name: 'Get Payout Report',
				value: 'getPayoutReport',
				description: 'Get payout report for a date range',
				action: 'Get payout report',
			},
			{
				name: 'Get Reconciliation Report',
				value: 'getReconciliationReport',
				description: 'Get reconciliation report',
				action: 'Get reconciliation report',
			},
		],
		default: 'getPaymentReport',
	},
];

export const reportingFields: INodeProperties[] = [
	// ----------------------------------
	//         Common date range fields
	// ----------------------------------
	{
		displayName: 'From Date',
		name: 'fromDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getPaymentReport', 'getPayoutReport', 'getMerchantReport', 'getReconciliationReport', 'export'],
			},
		},
		default: '',
		description: 'Start date for the report',
	},
	{
		displayName: 'To Date',
		name: 'toDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getPaymentReport', 'getPayoutReport', 'getMerchantReport', 'getReconciliationReport', 'export'],
			},
		},
		default: '',
		description: 'End date for the report',
	},

	// ----------------------------------
	//         reporting: getPaymentReport
	// ----------------------------------
	{
		displayName: 'Payment Report Options',
		name: 'paymentReportOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getPaymentReport'],
			},
		},
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'British Pound (GBP)', value: 'GBP' },
					{ name: 'Euro (EUR)', value: 'EUR' },
					{ name: 'Polish Zloty (PLN)', value: 'PLN' },
				],
				default: '',
				description: 'Filter by currency',
			},
			{
				displayName: 'Include Failed',
				name: 'includeFailed',
				type: 'boolean',
				default: false,
				description: 'Whether to include failed payments',
			},
			{
				displayName: 'Merchant Account ID',
				name: 'merchantAccountId',
				type: 'string',
				default: '',
				description: 'Filter by merchant account',
			},
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'string',
				default: '',
				description: 'Filter by bank provider',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Authorized', value: 'authorized' },
					{ name: 'Executed', value: 'executed' },
					{ name: 'Settled', value: 'settled' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Cancelled', value: 'cancelled' },
				],
				default: [],
				description: 'Filter by status',
			},
		],
	},

	// ----------------------------------
	//         reporting: getPayoutReport
	// ----------------------------------
	{
		displayName: 'Payout Report Options',
		name: 'payoutReportOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getPayoutReport'],
			},
		},
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'British Pound (GBP)', value: 'GBP' },
					{ name: 'Euro (EUR)', value: 'EUR' },
				],
				default: '',
				description: 'Filter by currency',
			},
			{
				displayName: 'Include Failed',
				name: 'includeFailed',
				type: 'boolean',
				default: false,
				description: 'Whether to include failed payouts',
			},
			{
				displayName: 'Merchant Account ID',
				name: 'merchantAccountId',
				type: 'string',
				default: '',
				description: 'Filter by merchant account',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Pending', value: 'pending' },
					{ name: 'Executed', value: 'executed' },
					{ name: 'Failed', value: 'failed' },
				],
				default: [],
				description: 'Filter by status',
			},
		],
	},

	// ----------------------------------
	//         reporting: getMerchantReport
	// ----------------------------------
	{
		displayName: 'Merchant Account ID',
		name: 'merchantAccountId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getMerchantReport'],
			},
		},
		default: '',
		description: 'The merchant account to generate report for',
	},
	{
		displayName: 'Merchant Report Options',
		name: 'merchantReportOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getMerchantReport'],
			},
		},
		options: [
			{
				displayName: 'Include Balance History',
				name: 'includeBalanceHistory',
				type: 'boolean',
				default: true,
				description: 'Whether to include balance history',
			},
			{
				displayName: 'Include Sweeps',
				name: 'includeSweeps',
				type: 'boolean',
				default: true,
				description: 'Whether to include sweep transactions',
			},
			{
				displayName: 'Include Transactions',
				name: 'includeTransactions',
				type: 'boolean',
				default: true,
				description: 'Whether to include transaction details',
			},
			{
				displayName: 'Transaction Type',
				name: 'transactionType',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payment In', value: 'payment_in' },
					{ name: 'Payout', value: 'payout' },
					{ name: 'Refund', value: 'refund' },
					{ name: 'Sweep', value: 'sweep' },
				],
				default: '',
				description: 'Filter by transaction type',
			},
		],
	},

	// ----------------------------------
	//         reporting: getReconciliationReport
	// ----------------------------------
	{
		displayName: 'Reconciliation Options',
		name: 'reconciliationOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['getReconciliationReport'],
			},
		},
		options: [
			{
				displayName: 'Group By',
				name: 'groupBy',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
				],
				default: 'day',
				description: 'How to group the report data',
			},
			{
				displayName: 'Include Fees',
				name: 'includeFees',
				type: 'boolean',
				default: true,
				description: 'Whether to include fee breakdown',
			},
			{
				displayName: 'Merchant Account ID',
				name: 'merchantAccountId',
				type: 'string',
				default: '',
				description: 'Filter by merchant account',
			},
		],
	},

	// ----------------------------------
	//         reporting: export
	// ----------------------------------
	{
		displayName: 'Report Type',
		name: 'reportType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['export'],
			},
		},
		options: [
			{ name: 'Payments', value: 'payments' },
			{ name: 'Payouts', value: 'payouts' },
			{ name: 'Merchant Account', value: 'merchant' },
			{ name: 'Reconciliation', value: 'reconciliation' },
		],
		default: 'payments',
		description: 'Type of report to export',
	},
	{
		displayName: 'Export Format',
		name: 'exportFormat',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['export'],
			},
		},
		options: [
			{ name: 'CSV', value: 'csv' },
			{ name: 'JSON', value: 'json' },
			{ name: 'PDF', value: 'pdf' },
		],
		default: 'csv',
		description: 'Format for the exported report',
	},
	{
		displayName: 'Export Options',
		name: 'exportOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['reporting'],
				operation: ['export'],
			},
		},
		options: [
			{
				displayName: 'Include Headers',
				name: 'includeHeaders',
				type: 'boolean',
				default: true,
				description: 'Whether to include column headers (CSV only)',
			},
			{
				displayName: 'Merchant Account ID',
				name: 'merchantAccountId',
				type: 'string',
				default: '',
				description: 'Filter by merchant account',
			},
		],
	},
];

export async function executeReportingOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	const fromDate = this.getNodeParameter('fromDate', index) as string;
	const toDate = this.getNodeParameter('toDate', index) as string;

	// Validate dates
	if (!fromDate || !toDate) {
		throw new NodeOperationError(
			this.getNode(),
			'From date and to date are required',
			{ itemIndex: index },
		);
	}

	const from = new Date(fromDate);
	const to = new Date(toDate);

	if (from > to) {
		throw new NodeOperationError(
			this.getNode(),
			'From date must be before to date',
			{ itemIndex: index },
		);
	}

	// Max 90 day range for reports
	const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
	if (daysDiff > 90) {
		throw new NodeOperationError(
			this.getNode(),
			'Report date range cannot exceed 90 days',
			{ itemIndex: index },
		);
	}

	if (operation === 'getPaymentReport') {
		const options = this.getNodeParameter('paymentReportOptions', index, {}) as {
			currency?: string;
			status?: string[];
			merchantAccountId?: string;
			providerId?: string;
			includeFailed?: boolean;
		};

		const queryParams: Record<string, string> = {
			from: from.toISOString(),
			to: to.toISOString(),
		};

		if (options.currency) {
			queryParams.currency = options.currency;
		}

		if (options.status && options.status.length > 0) {
			queryParams.status = options.status.join(',');
		}

		if (options.merchantAccountId) {
			queryParams.merchant_account_id = options.merchantAccountId;
		}

		if (options.providerId) {
			queryParams.provider_id = options.providerId;
		}

		if (options.includeFailed) {
			queryParams.include_failed = 'true';
		}

		const queryString = Object.entries(queryParams)
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/reports/payments?${queryString}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getPayoutReport') {
		const options = this.getNodeParameter('payoutReportOptions', index, {}) as {
			currency?: string;
			status?: string[];
			merchantAccountId?: string;
			includeFailed?: boolean;
		};

		const queryParams: Record<string, string> = {
			from: from.toISOString(),
			to: to.toISOString(),
		};

		if (options.currency) {
			queryParams.currency = options.currency;
		}

		if (options.status && options.status.length > 0) {
			queryParams.status = options.status.join(',');
		}

		if (options.merchantAccountId) {
			queryParams.merchant_account_id = options.merchantAccountId;
		}

		if (options.includeFailed) {
			queryParams.include_failed = 'true';
		}

		const queryString = Object.entries(queryParams)
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/reports/payouts?${queryString}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getMerchantReport') {
		const merchantAccountId = this.getNodeParameter('merchantAccountId', index) as string;
		const options = this.getNodeParameter('merchantReportOptions', index, {}) as {
			includeTransactions?: boolean;
			includeBalanceHistory?: boolean;
			includeSweeps?: boolean;
			transactionType?: string;
		};

		if (!isValidUUID(merchantAccountId)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid merchant account ID format. Must be a valid UUID.',
				{ itemIndex: index },
			);
		}

		const queryParams: Record<string, string> = {
			from: from.toISOString(),
			to: to.toISOString(),
		};

		if (options.includeTransactions !== false) {
			queryParams.include_transactions = 'true';
		}

		if (options.includeBalanceHistory !== false) {
			queryParams.include_balance_history = 'true';
		}

		if (options.includeSweeps !== false) {
			queryParams.include_sweeps = 'true';
		}

		if (options.transactionType) {
			queryParams.transaction_type = options.transactionType;
		}

		const queryString = Object.entries(queryParams)
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/reports/merchant-accounts/${merchantAccountId}?${queryString}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'getReconciliationReport') {
		const options = this.getNodeParameter('reconciliationOptions', index, {}) as {
			merchantAccountId?: string;
			groupBy?: string;
			includeFees?: boolean;
		};

		const queryParams: Record<string, string> = {
			from: from.toISOString(),
			to: to.toISOString(),
		};

		if (options.merchantAccountId) {
			queryParams.merchant_account_id = options.merchantAccountId;
		}

		if (options.groupBy) {
			queryParams.group_by = options.groupBy;
		}

		if (options.includeFees !== false) {
			queryParams.include_fees = 'true';
		}

		const queryString = Object.entries(queryParams)
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/reports/reconciliation?${queryString}`,
		);

		returnData.push({ json: response });
	}

	if (operation === 'export') {
		const reportType = this.getNodeParameter('reportType', index) as string;
		const exportFormat = this.getNodeParameter('exportFormat', index) as string;
		const options = this.getNodeParameter('exportOptions', index, {}) as {
			merchantAccountId?: string;
			includeHeaders?: boolean;
		};

		const queryParams: Record<string, string> = {
			from: from.toISOString(),
			to: to.toISOString(),
			format: exportFormat,
		};

		if (options.merchantAccountId) {
			queryParams.merchant_account_id = options.merchantAccountId;
		}

		if (options.includeHeaders !== undefined && exportFormat === 'csv') {
			queryParams.include_headers = options.includeHeaders.toString();
		}

		const queryString = Object.entries(queryParams)
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');

		const response = await client.get(
			`${ENDPOINTS.PAYMENTS.BASE}/v3/reports/${reportType}/export?${queryString}`,
		);

		returnData.push({ json: response });
	}

	return returnData;
}
