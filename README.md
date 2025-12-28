# n8n-nodes-truelayer

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for TrueLayer Open Banking API v3, providing complete Payment Initiation (PISP), Account Information (AISP), and identity verification capabilities across UK and European banks.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TrueLayer](https://img.shields.io/badge/TrueLayer-API%20v3-00D4FF)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **19 Resource Categories** covering the complete TrueLayer API
- **100+ Operations** for payments, payouts, accounts, and more
- **Webhook Trigger Node** for real-time event monitoring
- **Multi-Environment Support** - Production and Sandbox
- **Request Signing** - ES512 JWT signatures for secure payment initiation
- **OAuth 2.0** - Full authorization flow for Data API access
- **Variable Recurring Payments (VRP)** - Mandate-based flexible payments
- **Standing Orders** - Scheduled recurring payments
- **Merchant Accounts** - Balance, transactions, and sweeping
- **Identity Verification** - Signup+ product integration
- **Multi-Provider Support** - UK and EU banks

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-truelayer`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-truelayer
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-truelayer.git
cd n8n-nodes-truelayer

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-truelayer

# Restart n8n
n8n start
```

## Credentials Setup

### TrueLayer API Credentials (Payments/Payouts)

Used for Payment Initiation Service Provider (PISP) operations including payments, payouts, merchant accounts, and mandates.

| Field | Description | Required |
|-------|-------------|----------|
| Environment | Production or Sandbox | Yes |
| Client ID | TrueLayer Console client ID | Yes |
| Client Secret | TrueLayer Console client secret | Yes |
| Signing Key ID | Key ID for request signing | Yes |
| Private Key | EC private key (PEM format) for ES512 signing | Yes |
| Webhook Secret | Secret for webhook signature verification | No |

**Getting API Credentials:**

1. Sign up at [TrueLayer Console](https://console.truelayer.com)
2. Create a new application
3. Navigate to **Settings** → **API Keys**
4. Generate client credentials
5. Under **Signing Keys**, create a new EC key pair
6. Download the private key (keep it secure!)
7. Note the Key ID for the signing key

### TrueLayer OAuth Credentials (Data API)

Used for Account Information Service Provider (AISP) operations including account data, cards, and identity verification.

| Field | Description | Required |
|-------|-------------|----------|
| Environment | Production or Sandbox | Yes |
| Client ID | TrueLayer Console client ID | Yes |
| Client Secret | TrueLayer Console client secret | Yes |
| Scopes | Permissions (accounts, balance, transactions, etc.) | Yes |
| Pre-select Provider | Specific bank to use (optional) | No |
| Enable Mock Bank | Use sandbox mock bank for testing | No |

**OAuth Scopes:**

- `info` - Basic account information
- `accounts` - Account details
- `balance` - Account balances
- `transactions` - Transaction history
- `cards` - Card information
- `direct_debits` - Direct debit mandates
- `standing_orders` - Standing orders
- `offline_access` - Refresh token support

## Resources & Operations

### Payment Resource

Create and manage single immediate payments through UK and EU banks.

| Operation | Description |
|-----------|-------------|
| Create Payment | Initiate a new payment |
| Get Payment | Retrieve payment details |
| Get Payment Status | Check current payment status |
| List Payments | Get all payments with filtering |
| Cancel Payment | Cancel a pending payment |
| Create Refund | Refund a completed payment |
| Get Refund | Get refund details |
| Get Refunds | List refunds for a payment |
| Get Auth Flow | Get authorization flow status |
| Start Auth | Start payment authorization |
| Get Provider Selection | Get selected provider info |

### Payout Resource

Send money from your merchant account to customers or suppliers.

| Operation | Description |
|-----------|-------------|
| Create Payout | Initiate a payout |
| Get Payout | Retrieve payout details |
| Get Payout Status | Check payout status |
| List Payouts | Get all payouts |

### Merchant Account Resource

Manage your TrueLayer merchant settlement accounts.

| Operation | Description |
|-----------|-------------|
| Get Merchant Account | Get account details |
| List Merchant Accounts | Get all merchant accounts |
| Get Balance | Get account balance |
| Get Transactions | Get transaction history |
| Get Sweeping Settings | Get automatic sweep config |
| Update Sweeping Settings | Configure auto-sweeping |

### Standing Order Resource

Create scheduled recurring payments.

| Operation | Description |
|-----------|-------------|
| Create Standing Order | Set up a new standing order |
| Get Standing Order | Get standing order details |
| List Standing Orders | Get all standing orders |
| Cancel Standing Order | Cancel a standing order |

### Mandate Resource (Variable Recurring Payments)

Create VRP mandates for flexible recurring payments.

| Operation | Description |
|-----------|-------------|
| Create Mandate | Create a VRP mandate |
| Get Mandate | Get mandate details |
| List Mandates | Get all mandates |
| Revoke Mandate | Revoke an active mandate |
| Get Constraints | Get mandate spending limits |
| Get Authorization | Get authorization status |
| Create Payment | Create payment from mandate |

### Data API - Account Resource

Access customer bank account information with consent.

| Operation | Description |
|-----------|-------------|
| Get Accounts | List all connected accounts |
| Get Account | Get specific account details |
| Get Balance | Get account balance |
| Get Transactions | Get transaction history |
| Get Pending Transactions | Get pending transactions |
| Get Standing Orders | List account standing orders |
| Get Direct Debits | List direct debits |

### Data API - Card Resource

Access customer credit/debit card information.

| Operation | Description |
|-----------|-------------|
| Get Cards | List all connected cards |
| Get Card | Get specific card details |
| Get Balance | Get card balance/credit |
| Get Transactions | Get card transactions |
| Get Pending Transactions | Get pending card transactions |

### Data API - Identity Resource

Verify customer identity through their bank.

| Operation | Description |
|-----------|-------------|
| Get Identity | Get verified identity data |
| Get Identity with Accounts | Get identity with account ownership |
| Get Info | Get basic identity info |

### Bank Resource

Search and query available banking providers.

| Operation | Description |
|-----------|-------------|
| Get Providers | List all available providers |
| Get Provider | Get specific provider details |
| Search Providers | Search by name/country |
| Get by Country | Filter providers by country |
| Get Enabled | Get your enabled providers |
| Get Capabilities | Get provider capabilities |

### User Resource

Manage user consents for data access.

| Operation | Description |
|-----------|-------------|
| Get Consents | List user consents |
| Delete Consent | Revoke a consent |
| Get Status | Check consent status |
| Refresh | Refresh consent access |

### Auth Link Resource

Generate authorization URLs for user consent.

| Operation | Description |
|-----------|-------------|
| Create | Generate auth link URL |
| Get Status | Check auth link status |
| Get Configuration | Get auth link config |

### Beneficiary Resource

Manage payment beneficiaries.

| Operation | Description |
|-----------|-------------|
| Create | Add a new beneficiary |
| Get | Get beneficiary details |
| List | Get all beneficiaries |
| Delete | Remove a beneficiary |
| Verify | Verify beneficiary account |

### Verification Resource

Verify account ownership and details.

| Operation | Description |
|-----------|-------------|
| Verify Account | Initiate account verification |
| Get Status | Check verification status |
| Get Ownership | Get ownership verification |

### Webhook Resource

Manage webhook subscriptions.

| Operation | Description |
|-----------|-------------|
| Create | Create webhook endpoint |
| Get | Get webhook details |
| List | Get all webhooks |
| Update | Update webhook URL/events |
| Delete | Remove a webhook |
| Get Events | List webhook events |
| Verify Signature | Verify webhook signature |

### Signup+ Resource

Identity verification product integration.

| Operation | Description |
|-----------|-------------|
| Start Flow | Initiate Signup+ flow |
| Get Status | Check verification status |
| Get Data | Get verification data |
| Get Verified Identity | Get verified identity details |

### Token Resource

Manage OAuth tokens.

| Operation | Description |
|-----------|-------------|
| Exchange Code | Exchange auth code for token |
| Refresh | Refresh access token |
| Revoke | Revoke token |
| Get Info | Get token information |

### Reporting Resource

Generate payment and reconciliation reports.

| Operation | Description |
|-----------|-------------|
| Payment Report | Generate payment report |
| Payout Report | Generate payout report |
| Merchant Report | Generate merchant account report |
| Reconciliation Report | Generate reconciliation report |
| Export | Export report data |

### Configuration Resource

Query API configuration.

| Operation | Description |
|-----------|-------------|
| Get | Get API configuration |
| Get Countries | Get supported countries |
| Get Currencies | Get supported currencies |
| Update | Update configuration |

### Utility Resource

Helper operations for validation and testing.

| Operation | Description |
|-----------|-------------|
| Validate IBAN | Validate IBAN checksum |
| Validate Sort Code | Validate UK sort code |
| Get API Status | Check TrueLayer API status |
| Test Connection | Test credential validity |
| Get Public Key | Get TrueLayer public key |

## Trigger Node

The **TrueLayer Trigger** node listens for real-time webhook events.

### Supported Event Categories

| Category | Events |
|----------|--------|
| Payment | authorized, executed, settled, failed, cancelled, pending |
| Payout | executed, failed, pending |
| Refund | executed, failed, pending |
| Mandate | authorized, revoked, payment_executed, payment_failed |
| Standing Order | created, executed, failed, cancelled |
| Merchant Account | transaction_received, balance_changed, sweep_executed |
| Consent | granted, revoked, expired |
| Verification | completed, failed |
| Signup | started, completed, identity_verified |

### Trigger Configuration

1. Add the TrueLayer Trigger node to your workflow
2. Select event categories to monitor
3. Copy the generated webhook URL
4. Register the URL in TrueLayer Console under Webhooks
5. Add your webhook secret to credentials
6. Activate the workflow

## Usage Examples

### Creating a Payment

```javascript
// TrueLayer node configuration
{
  "resource": "payment",
  "operation": "create",
  "amount": 1000, // £10.00 in minor units (pence)
  "currency": "GBP",
  "paymentMethod": "bank_transfer",
  "beneficiaryName": "Merchant Ltd",
  "beneficiaryType": "sort_code_account_number",
  "sortCode": "040004",
  "accountNumber": "12345678",
  "reference": "Order-12345",
  "userId": "user-uuid-here"
}
```

### Getting Account Transactions

```javascript
// TrueLayer node configuration (requires OAuth credential)
{
  "resource": "dataAccount",
  "operation": "getTransactions",
  "accountId": "account-uuid-here",
  "from": "2024-01-01",
  "to": "2024-12-31"
}
```

### Creating a VRP Mandate

```javascript
// TrueLayer node configuration
{
  "resource": "mandate",
  "operation": "create",
  "mandateType": "sweeping",
  "currency": "GBP",
  "maximumIndividualAmount": 50000, // £500 per payment
  "periodicLimit": 100000, // £1000 per period
  "period": "month",
  "userId": "user-uuid-here"
}
```

### Initiating a Payout

```javascript
// TrueLayer node configuration
{
  "resource": "payout",
  "operation": "create",
  "merchantAccountId": "merchant-account-uuid",
  "amount": 5000, // £50.00
  "currency": "GBP",
  "beneficiaryName": "Customer Name",
  "sortCode": "040004",
  "accountNumber": "12345678",
  "reference": "Refund-12345"
}
```

## Open Banking Concepts

### PSD2 and Open Banking

TrueLayer operates under PSD2 (Payment Services Directive 2) regulation in Europe and Open Banking standards in the UK. This enables:

- **PISP** (Payment Initiation Service Provider) - Initiate payments directly from bank accounts
- **AISP** (Account Information Service Provider) - Access account data with user consent

### Authentication Flows

1. **Redirect Flow** - User redirected to bank for authentication
2. **Embedded Flow** - Authentication within your application (limited availability)
3. **Decoupled Flow** - Authentication on separate device (mobile banking app)

### Request Signing

TrueLayer Payments API requires cryptographic signing of requests using ES512 (ECDSA with SHA-512). The signature includes:

- HTTP method and path
- Request body digest (SHA-512)
- Idempotency-Key header

### Idempotency

All payment and payout creation requests require an `Idempotency-Key` header (UUID v4) to prevent duplicate transactions on retry. The node generates this automatically.

### Variable Recurring Payments (VRP)

VRP mandates allow flexible recurring payments with constraints:

- Maximum individual payment amount
- Periodic spending limits (daily/weekly/monthly)
- Automatic payment scheduling

### Sweeping

Merchant account sweeping automatically transfers funds to an external account based on:

- Threshold amount - Sweep when balance exceeds threshold
- Schedule - Sweep at regular intervals

## Supported Countries

| Country | Code | Currency |
|---------|------|----------|
| United Kingdom | GB | GBP |
| Ireland | IE | EUR |
| France | FR | EUR |
| Germany | DE | EUR |
| Spain | ES | EUR |
| Netherlands | NL | EUR |
| Belgium | BE | EUR |
| Italy | IT | EUR |
| Poland | PL | PLN |
| Norway | NO | NOK |
| Sweden | SE | SEK |
| Denmark | DK | DKK |
| Finland | FI | EUR |
| Austria | AT | EUR |
| Portugal | PT | EUR |
| Lithuania | LT | EUR |
| Latvia | LV | EUR |
| Estonia | EE | EUR |

## Error Handling

The node provides detailed error messages for common scenarios:

| Error Type | Description | Resolution |
|------------|-------------|------------|
| `invalid_credentials` | Invalid client ID or secret | Check TrueLayer Console credentials |
| `invalid_signature` | Request signing failed | Verify private key format and Key ID |
| `consent_required` | User consent needed | Redirect user to authorization |
| `consent_expired` | User consent has expired | Request new consent |
| `provider_error` | Bank returned an error | Check provider status |
| `rate_limit_exceeded` | Too many requests | Implement backoff strategy |
| `insufficient_funds` | Account lacks funds | Check account balance |

## Security Best Practices

1. **Never log sensitive data** - API secrets, private keys, and PII should never appear in logs
2. **Use sandbox for testing** - Always test with sandbox credentials first
3. **Verify webhook signatures** - Always validate webhook authenticity
4. **Secure private keys** - Store private keys in secure credential storage
5. **Minimize token scope** - Request only necessary OAuth scopes
6. **Handle consent properly** - Store consent tokens securely, handle expiry
7. **Use idempotency** - Always include idempotency keys for payments
8. **Monitor for fraud** - Implement appropriate transaction monitoring

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [TrueLayer API Docs](https://docs.truelayer.com)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-truelayer/issues)
- **Licensing**: licensing@velobpa.com

## Acknowledgments

- [TrueLayer](https://truelayer.com) for their comprehensive Open Banking API
- [n8n](https://n8n.io) for the workflow automation platform
- The Open Banking community for driving financial innovation
