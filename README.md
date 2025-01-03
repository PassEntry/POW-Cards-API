# POW Cards API

POW Cards API enables you to create digital wallet cards authenticated with Solana wallets. The API provides a simple way to verify wallet ownership and generate passes that can be added to Apple Wallet and Google Wallet.

## Features

- **Solana Wallet Authentication** - Securely verify wallet ownership
- **Digital Wallet Passes** - Generate passes compatible with Apple Wallet and Google Pay
- **Rate Limiting** - Built-in rate limiting for API protection
- **TypeScript Support** - Full TypeScript support for type safety

## Prerequisites

- Node.js (v19 or higher)
- npm or yarn
- Environment variables configured (see Configuration section)

## Installation

1. Clone the repository: 
```bash
git clone https://github.com/PassEntry/POW-Cards-API.git
cd POW-Cards-API
```
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (see Configuration section)

4. Start the development server:
```bash
npm run dev
```


## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm test` - Run tests

## Configuration

Create a `.env` file in the root directory with the following variables:
```env
PORT=3001
PASSENTRY_API_KEY=""
```

## API Endpoints

### Health Check
```
GET /health
```

### Initialize Claim Process
```
GET /api/v1/claim/init?publicKey={solanaPublicKey}
```

### Verify Signature and Create Pass
```
POST /api/v1/claim/wallet-pass
```


For detailed API documentation, visit our [API Reference](https://docs.pow.cards/api-reference/overview).

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages in the following format:
```json
{
"error": "Error message",
"details": "Detailed error description"
}
```


## Rate Limiting

- 100 requests per 15 minutes for claim endpoints
- Standard rate limits for health check endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

Need help? Contact us:
- Email: info@passentry.com
- GitHub Issues: [Report issues](https://github.com/PassEntry/pow-cards-api/issues)