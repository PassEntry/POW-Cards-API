import { Request, Response } from 'express';
export declare class AuthController {
    createSignInData(req: Request, res: Response): void;
    verifySignIn(req: Request, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
