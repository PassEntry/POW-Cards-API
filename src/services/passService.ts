import { WALLET_TEMPLATE_IDS, WalletTemplateType } from "../config/walletConfig";

interface PassEntryResponse {
  data: {
    attributes: {
      downloadUrl: string;
      status: string;
    }
  }
}

export class PassService {
  private readonly API_URL = 'https://api.passentry.com/api/v1/passes';
  private readonly API_KEY = process.env.PASSENTRY_API_KEY!;

  private isValidTemplate(template: string): template is WalletTemplateType {
    return template in WALLET_TEMPLATE_IDS;
  }

  async getOrCreateWalletPass(address: string, template: string = 'Generic'): Promise<string> {
    try {
      // First try to get existing pass
      const response = await fetch(`${this.API_URL}/${address}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as PassEntryResponse;
        return data.data.attributes.downloadUrl;
      }

      if (response.status !== 404) {
        const errorData = await response.text();
        console.error('Wallet pass fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        const error = new Error('Failed to fetch wallet pass');
        (error as any).details = errorData;
        throw error;
      }

      // If 404, create new pass
      return this.createWalletPass(address, template);

    } catch (error) {
      // Only wrap network/unexpected errors
      if (!(error instanceof Error) || !(error as any).details) {
        console.error('Wallet pass fetch failed:', error);
        const wrappedError = new Error('Failed to fetch wallet pass');
        (wrappedError as any).details = error instanceof Error ? error.message : 'Unknown error';
        throw wrappedError;
      }
      throw error;
    }
  }

  async createWalletPass(address: string, template: string = 'Generic'): Promise<string> {
    try {
        console.log(template)
        const validTemplate = this.isValidTemplate(template) ? template : 'Generic';
        const templateId = WALLET_TEMPLATE_IDS[validTemplate];
        const requestUrl = `${this.API_URL}?passTemplate=${templateId}&extId=${address}`;
        const authHeader = `Bearer ${this.API_KEY}`;
        
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                pass: {
                    nfc: { 
                        enabled: true,
                        source: "extId"
                     },
                    qr: {
                        value: address
                    },
                    address: address,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Wallet pass creation failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            const error = new Error('Failed to create wallet pass');
            (error as any).details = errorData;
            throw error;
        }

        const data = await response.json() as PassEntryResponse;
        return data.data.attributes.downloadUrl;
    } catch (error) {
        // Only wrap network/unexpected errors
        if (!(error instanceof Error) || !(error as any).details) {
            console.error('Wallet pass creation failed:', error);
            const wrappedError = new Error('Failed to create wallet pass');
            (wrappedError as any).details = error instanceof Error ? error.message : 'Unknown error';
            throw wrappedError;
        }
        throw error;
    }
  }
}

export default new PassService();