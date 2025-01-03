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
 * @interface VerifySignatureAndCreatePass400Response
 */
export interface VerifySignatureAndCreatePass400Response {
    /**
     * 
     * @type {string}
     * @memberof VerifySignatureAndCreatePass400Response
     */
    error?: string;
    /**
     * 
     * @type {string}
     * @memberof VerifySignatureAndCreatePass400Response
     */
    details?: string;
}

/**
 * Check if a given object implements the VerifySignatureAndCreatePass400Response interface.
 */
export function instanceOfVerifySignatureAndCreatePass400Response(value: object): value is VerifySignatureAndCreatePass400Response {
    return true;
}

export function VerifySignatureAndCreatePass400ResponseFromJSON(json: any): VerifySignatureAndCreatePass400Response {
    return VerifySignatureAndCreatePass400ResponseFromJSONTyped(json, false);
}

export function VerifySignatureAndCreatePass400ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): VerifySignatureAndCreatePass400Response {
    if (json == null) {
        return json;
    }
    return {
        
        'error': json['error'] == null ? undefined : json['error'],
        'details': json['details'] == null ? undefined : json['details'],
    };
}

export function VerifySignatureAndCreatePass400ResponseToJSON(json: any): VerifySignatureAndCreatePass400Response {
    return VerifySignatureAndCreatePass400ResponseToJSONTyped(json, false);
}

export function VerifySignatureAndCreatePass400ResponseToJSONTyped(value?: VerifySignatureAndCreatePass400Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'error': value['error'],
        'details': value['details'],
    };
}

