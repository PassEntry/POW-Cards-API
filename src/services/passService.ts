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
  private readonly TEMPLATE_ID = '9196360145332bbe96e8283b';
  private readonly API_KEY = process.env.PASSENTRY_API_KEY!;

  async createWalletPass(address: string): Promise<string> {
    try {
        const requestUrl = `${this.API_URL}?passTemplate=${this.TEMPLATE_ID}`;
        const authHeader = `Bearer ${this.API_KEY}`;
        
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                pass: {
                    nfc: { enabled: true },
                    address
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