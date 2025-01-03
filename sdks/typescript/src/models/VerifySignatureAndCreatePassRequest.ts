/* tslint:disable */
/* eslint-disable */
/**
 * POW Cards API
 * API for creating and managing POW wallet cards with Solana authentication
 *
 * The version of the OpenAPI document: 1.0.0
 * Contact: info@passentry.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface VerifySignatureAndCreatePassRequest
 */
export interface VerifySignatureAndCreatePassRequest {
    /**
     * The signed message from /claim/init
     * @type {string}
     * @memberof VerifySignatureAndCreatePassRequest
     */
    message: string;
    /**
     * Base58 encoded signature
     * @type {string}
     * @memberof VerifySignatureAndCreatePassRequest
     */
    signature: string;
    /**
     * Solana wallet public key
     * @type {string}
     * @memberof VerifySignatureAndCreatePassRequest
     */
    publicKey: string;
    /**
     * Type of wallet used for signing
     * @type {string}
     * @memberof VerifySignatureAndCreatePassRequest
     */
    walletType?: VerifySignatureAndCreatePassRequestWalletTypeEnum;
}


/**
 * @export
 */
export const VerifySignatureAndCreatePassRequestWalletTypeEnum = {
    Generic: 'Generic',
    Phantom: 'Phantom',
    Solflare: 'Solflare',
    CoinbaseWallet: 'Coinbase Wallet',
    MathWallet: 'MathWallet',
    SafePal: 'SafePal',
    Clover: 'Clover',
    Coin98: 'Coin98',
    HyperPay: 'HyperPay',
    Krystal: 'Krystal',
    Onto: 'ONTO',
    TokenPocket: 'TokenPocket',
    Trust: 'Trust'
} as const;
export type VerifySignatureAndCreatePassRequestWalletTypeEnum = typeof VerifySignatureAndCreatePassRequestWalletTypeEnum[keyof typeof VerifySignatureAndCreatePassRequestWalletTypeEnum];


/**
 * Check if a given object implements the VerifySignatureAndCreatePassRequest interface.
 */
export function instanceOfVerifySignatureAndCreatePassRequest(value: object): value is VerifySignatureAndCreatePassRequest {
    if (!('message' in value) || value['message'] === undefined) return false;
    if (!('signature' in value) || value['signature'] === undefined) return false;
    if (!('publicKey' in value) || value['publicKey'] === undefined) return false;
    return true;
}

export function VerifySignatureAndCreatePassRequestFromJSON(json: any): VerifySignatureAndCreatePassRequest {
    return VerifySignatureAndCreatePassRequestFromJSONTyped(json, false);
}

export function VerifySignatureAndCreatePassRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): VerifySignatureAndCreatePassRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'message': json['message'],
        'signature': json['signature'],
        'publicKey': json['publicKey'],
        'walletType': json['walletType'] == null ? undefined : json['walletType'],
    };
}

export function VerifySignatureAndCreatePassRequestToJSON(json: any): VerifySignatureAndCreatePassRequest {
    return VerifySignatureAndCreatePassRequestToJSONTyped(json, false);
}

export function VerifySignatureAndCreatePassRequestToJSONTyped(value?: VerifySignatureAndCreatePassRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'message': value['message'],
        'signature': value['signature'],
        'publicKey': value['publicKey'],
        'walletType': value['walletType'],
    };
}

