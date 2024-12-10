interface SignInData {
    domain: string;
    nonce: string;
    issuedAt: string;
}
interface VerifyResult {
    verified: boolean;
    reason: string | null;
}
interface NonceData {
    issuedAt: string;
    expiresAt: number;
    publicKey: string;
}
declare class AuthService {
    private _usedNonces;
    private nonceExpiration;
    protected get usedNonces(): Map<string, NonceData>;
    createSignInData(domain: string, publicKey: string): SignInData;
    verifySignIn(message: string, signature: string, publicKeyStr: string): Promise<VerifyResult>;
}
declare const _default: AuthService;
export default _default;
