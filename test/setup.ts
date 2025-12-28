/**
 * @fileoverview Jest test setup
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.warn for licensing notices
const originalWarn = console.warn;
beforeAll(() => {
	console.warn = (...args: any[]) => {
		// Suppress licensing notices during tests
		if (args[0]?.includes?.('Velocity BPA Licensing Notice')) {
			return;
		}
		originalWarn.apply(console, args);
	};
});

afterAll(() => {
	console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
	generateUuid: () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	},
	
	mockCredentials: {
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
		signingKeyId: 'test-signing-key-id',
		privateKey: '-----BEGIN EC PRIVATE KEY-----\nMock Key\n-----END EC PRIVATE KEY-----',
		webhookSecret: 'test-webhook-secret',
	},
};

// Type declaration for global test utilities
declare global {
	var testUtils: {
		generateUuid: () => string;
		mockCredentials: {
			clientId: string;
			clientSecret: string;
			signingKeyId: string;
			privateKey: string;
			webhookSecret: string;
		};
	};
}
