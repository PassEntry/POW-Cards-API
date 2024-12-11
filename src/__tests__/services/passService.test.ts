import passService from '../../services/passService';
import { TEST_CONSTANTS } from '../testConstants';

describe('PassService', () => {
    const mockDownloadUrl = 'https://download.passentry.com/download?pass=mockId';
    const mockAddress = TEST_CONSTANTS.TEST_PUBLIC_KEY;
    let consoleErrorSpy: jest.SpyInstance;
    
    beforeAll(() => {
        // Set up test environment variables
        process.env.PASSENTRY_API_KEY = 'test-api-key';
    });
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Silence console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    afterAll(() => {
        // Clean up
        delete process.env.PASSENTRY_API_KEY;
    });

    test('createWalletPass should create pass successfully', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                data: {
                    attributes: {
                        downloadUrl: mockDownloadUrl,
                        status: 'issued'
                    }
                }
            })
        });

        const result = await passService.createWalletPass(mockAddress);

        expect(result).toBe(mockDownloadUrl);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.passentry.com/api/v1/passes'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': expect.stringContaining('Bearer ')
                },
                body: JSON.stringify({
                    pass: {
                        nfc: { enabled: true },
                        address: mockAddress
                    }
                })
            })
        );
    });

    test('createWalletPass should throw error on API failure', async () => {
        const errorMessage = 'Error message from server';
        
        // Mock fetch failure with proper response methods
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve(errorMessage)
        });

        try {
            await passService.createWalletPass(mockAddress);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Failed to create wallet pass');
            expect(error.details).toBe(errorMessage);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Wallet pass creation failed:',
                expect.objectContaining({
                    status: 500,
                    statusText: 'Internal Server Error',
                    error: errorMessage
                })
            );
        }
    });

    test('createWalletPass should handle network errors', async () => {
        global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

        try {
            await passService.createWalletPass(mockAddress);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Failed to create wallet pass');
            expect(consoleErrorSpy).toHaveBeenCalled();
        }
    });
}); 