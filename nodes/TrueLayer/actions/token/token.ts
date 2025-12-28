// @ts-nocheck
/**
 * TrueLayer Token Resource
 * OAuth token management operations
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
import { ENDPOINTS, OAUTH_SCOPES } from '../../constants/endpoints';

export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Exchange Code',
				value: 'exchangeCode',
				description: 'Exchange authorization code for access token',
				action: 'Exchange code for token',
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get token information',
				action: 'Get token info',
			},
			{
				name: 'Refresh',
				value: 'refresh',
				description: 'Refresh an access token',
				action: 'Refresh token',
			},
			{
				name: 'Revoke',
				value: 'revoke',
				description: 'Revoke an access token',
				action: 'Revoke token',
			},
		],
		default: 'exchangeCode',
	},
];

export const tokenFields: INodeProperties[] = [
	// ----------------------------------
	//         token: exchangeCode
	// ----------------------------------
	{
		displayName: 'Authorization Code',
		name: 'authCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['exchangeCode'],
			},
		},
		default: '',
		description: 'The authorization code received from the OAuth callback',
	},
	{
		displayName: 'Redirect URI',
		name: 'redirectUri',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['exchangeCode'],
			},
		},
		default: '',
		description: 'The redirect URI used in the authorization request (must match exactly)',
	},
	{
		displayName: 'Code Verifier',
		name: 'codeVerifier',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['exchangeCode'],
			},
		},
		default: '',
		description: 'PKCE code verifier if PKCE was used in authorization',
	},

	// ----------------------------------
	//         token: refresh
	// ----------------------------------
	{
		displayName: 'Refresh Token',
		name: 'refreshToken',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['refresh'],
			},
		},
		default: '',
		description: 'The refresh token to use',
	},

	// ----------------------------------
	//         token: revoke
	// ----------------------------------
	{
		displayName: 'Token',
		name: 'token',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['revoke'],
			},
		},
		default: '',
		description: 'The access or refresh token to revoke',
	},
	{
		displayName: 'Token Type Hint',
		name: 'tokenTypeHint',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['revoke'],
			},
		},
		options: [
			{
				name: 'Access Token',
				value: 'access_token',
			},
			{
				name: 'Refresh Token',
				value: 'refresh_token',
			},
		],
		default: 'access_token',
		description: 'Hint about the type of token being revoked',
	},

	// ----------------------------------
	//         token: getInfo
	// ----------------------------------
	{
		displayName: 'Access Token',
		name: 'accessToken',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getInfo'],
			},
		},
		default: '',
		description: 'The access token to get information about',
	},
];

export async function executeTokenOperation(
	this: IExecuteFunctions,
	index: number,
	client: TrueLayerClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	// Get credentials for OAuth operations
	const credentials = await this.getCredentials('trueLayerApi');
	const environment = credentials.environment as string || 'sandbox';
	
	const authUrl = environment === 'production'
		? ENDPOINTS.AUTH.PRODUCTION
		: ENDPOINTS.AUTH.SANDBOX;

	if (operation === 'exchangeCode') {
		const authCode = this.getNodeParameter('authCode', index) as string;
		const redirectUri = this.getNodeParameter('redirectUri', index) as string;
		const codeVerifier = this.getNodeParameter('codeVerifier', index, '') as string;

		if (!authCode) {
			throw new NodeOperationError(
				this.getNode(),
				'Authorization code is required',
				{ itemIndex: index },
			);
		}

		if (!redirectUri) {
			throw new NodeOperationError(
				this.getNode(),
				'Redirect URI is required',
				{ itemIndex: index },
			);
		}

		const body: Record<string, string> = {
			grant_type: 'authorization_code',
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
			code: authCode,
			redirect_uri: redirectUri,
		};

		if (codeVerifier) {
			body.code_verifier = codeVerifier;
		}

		// Make direct request to auth endpoint
		const axios = require('axios');
		try {
			const response = await axios.post(
				`${authUrl}/connect/token`,
				new URLSearchParams(body).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			);

			returnData.push({
				json: {
					access_token: response.data.access_token,
					token_type: response.data.token_type,
					expires_in: response.data.expires_in,
					refresh_token: response.data.refresh_token,
					scope: response.data.scope,
				},
			});
		} catch (error) {
			const axiosError = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
			throw new NodeOperationError(
				this.getNode(),
				`Token exchange failed: ${axiosError.response?.data?.error_description || axiosError.message}`,
				{ itemIndex: index },
			);
		}
	}

	if (operation === 'refresh') {
		const refreshToken = this.getNodeParameter('refreshToken', index) as string;

		if (!refreshToken) {
			throw new NodeOperationError(
				this.getNode(),
				'Refresh token is required',
				{ itemIndex: index },
			);
		}

		const body: Record<string, string> = {
			grant_type: 'refresh_token',
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
			refresh_token: refreshToken,
		};

		const axios = require('axios');
		try {
			const response = await axios.post(
				`${authUrl}/connect/token`,
				new URLSearchParams(body).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			);

			returnData.push({
				json: {
					access_token: response.data.access_token,
					token_type: response.data.token_type,
					expires_in: response.data.expires_in,
					refresh_token: response.data.refresh_token,
					scope: response.data.scope,
				},
			});
		} catch (error) {
			const axiosError = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
			throw new NodeOperationError(
				this.getNode(),
				`Token refresh failed: ${axiosError.response?.data?.error_description || axiosError.message}`,
				{ itemIndex: index },
			);
		}
	}

	if (operation === 'revoke') {
		const token = this.getNodeParameter('token', index) as string;
		const tokenTypeHint = this.getNodeParameter('tokenTypeHint', index, 'access_token') as string;

		if (!token) {
			throw new NodeOperationError(
				this.getNode(),
				'Token is required',
				{ itemIndex: index },
			);
		}

		const body: Record<string, string> = {
			token,
			token_type_hint: tokenTypeHint,
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
		};

		const axios = require('axios');
		try {
			await axios.post(
				`${authUrl}/connect/revocation`,
				new URLSearchParams(body).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			);

			returnData.push({
				json: {
					success: true,
					message: 'Token revoked successfully',
				},
			});
		} catch (error) {
			const axiosError = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
			throw new NodeOperationError(
				this.getNode(),
				`Token revocation failed: ${axiosError.response?.data?.error_description || axiosError.message}`,
				{ itemIndex: index },
			);
		}
	}

	if (operation === 'getInfo') {
		const accessToken = this.getNodeParameter('accessToken', index) as string;

		if (!accessToken) {
			throw new NodeOperationError(
				this.getNode(),
				'Access token is required',
				{ itemIndex: index },
			);
		}

		const body: Record<string, string> = {
			token: accessToken,
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
		};

		const axios = require('axios');
		try {
			const response = await axios.post(
				`${authUrl}/connect/introspect`,
				new URLSearchParams(body).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			);

			returnData.push({
				json: {
					active: response.data.active,
					client_id: response.data.client_id,
					scope: response.data.scope,
					sub: response.data.sub,
					exp: response.data.exp,
					iat: response.data.iat,
					token_type: response.data.token_type,
				},
			});
		} catch (error) {
			const axiosError = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
			throw new NodeOperationError(
				this.getNode(),
				`Token introspection failed: ${axiosError.response?.data?.error_description || axiosError.message}`,
				{ itemIndex: index },
			);
		}
	}

	return returnData;
}
