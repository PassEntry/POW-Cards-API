export const WALLET_TEMPLATE_IDS = {
  Generic: '20919d2d6bfdf34c51d790cb',
  Phantom: '34e97ac44173bcffd8f190c0',
  Solflare: '567d3cd05ee73c6237458e04',
  'Coinbase Wallet': '7214ef88f0c120b1de2edd96',
  MathWallet: 'e9d7e38671a4dc8f4ca2133a',
  SafePal: '9c80f3f380efb261e386fe4a',
  Clover: 'dd2dc10d39a297ebda2f606c',
  Coin98: '7af89e19fa391e58592c05cc',
  HyperPay: '5712195aaebb58a259a68dcf',
  Krystal: '0b8a750e2b1de48d2c07f01f',
  ONTO: '6a22f79670aa6948dd4be005',
  TokenPocket: '30a964f63de39566dac6e328',
  Trust: 'a9586f6c9e81801cd6648cb3'
} as const;

export type WalletTemplateType = keyof typeof WALLET_TEMPLATE_IDS; 