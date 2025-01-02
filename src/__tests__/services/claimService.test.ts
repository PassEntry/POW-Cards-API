import claimService from '../../services/claimService';
import authService from '../../services/authService';
import passService from '../../services/passService';
import { TEST_CONSTANTS } from '../testConstants';

jest.mock('../../services/authService');
jest.mock('../../services/passService');

describe('ClaimService', () => {
    const mockDownloadUrl = 'https://download.passentry.com/download?pass=mockId';
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test('should handle successful claim', async () => {
        // Mock successful verification
        jest.mocked(authService.verifySignIn).mockResolvedValueOnce({
            success: true
        });

        // Mock successful pass creation
        jest.mocked(passService.getOrCreateWalletPass).mockResolvedValueOnce(mockDownloadUrl);

        const result = await claimService.handleClaim(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );

        expect(result).toEqual({ downloadUrl: mockDownloadUrl });
        expect(authService.verifySignIn).toHaveBeenCalledWith(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );
        expect(passService.getOrCreateWalletPass).toHaveBeenCalledWith(
            TEST_CONSTANTS.TEST_PUBLIC_KEY, "generic"
        );
    });

    test('should handle verification failure', async () => {
        const failureReason = 'Invalid signature';
        jest.mocked(authService.verifySignIn).mockResolvedValueOnce({
            success: false,
            reason: failureReason
        });

        const result = await claimService.handleClaim(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );

        expect(result).toEqual({ reason: failureReason });
        expect(passService.getOrCreateWalletPass).not.toHaveBeenCalled();
    });

    test('should handle pass creation failure', async () => {
        jest.mocked(authService.verifySignIn).mockResolvedValueOnce({
            success: true
        });

        const error = new Error('Failed to create pass');
        jest.mocked(passService.getOrCreateWalletPass).mockRejectedValueOnce(error);

        await expect(claimService.handleClaim(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        )).rejects.toThrow('Failed to create pass');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Claim processing error:',
            error
        );
    });

    test('should handle successful claim with custom walletType', async () => {
        jest.mocked(authService.verifySignIn).mockResolvedValueOnce({
            success: true
        });

        jest.mocked(passService.getOrCreateWalletPass).mockResolvedValueOnce(mockDownloadUrl);

        const result = await claimService.handleClaim(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY,
            'phantom'
        );

        expect(result).toEqual({ downloadUrl: mockDownloadUrl });
        expect(authService.verifySignIn).toHaveBeenCalledWith(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );
        expect(passService.getOrCreateWalletPass).toHaveBeenCalledWith(
            TEST_CONSTANTS.TEST_PUBLIC_KEY,
            'phantom'
        );
    });

    test('should use default walletType when not provided', async () => {
        jest.mocked(authService.verifySignIn).mockResolvedValueOnce({
            success: true
        });

        jest.mocked(passService.getOrCreateWalletPass).mockResolvedValueOnce(mockDownloadUrl);

        await claimService.handleClaim(
            'test message',
            'test signature',
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );

        expect(passService.getOrCreateWalletPass).toHaveBeenCalledWith(
            TEST_CONSTANTS.TEST_PUBLIC_KEY,
            'Generic'
        );
    });
}); 