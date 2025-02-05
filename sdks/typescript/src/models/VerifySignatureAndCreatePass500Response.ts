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
 * @interface VerifySignatureAndCreatePass500Response
 */
export interface VerifySignatureAndCreatePass500Response {
    /**
     * 
     * @type {string}
     * @memberof VerifySignatureAndCreatePass500Response
     */
    error?: string;
    /**
     * 
     * @type {string}
     * @memberof VerifySignatureAndCreatePass500Response
     */
    details?: string;
}

/**
 * Check if a given object implements the VerifySignatureAndCreatePass500Response interface.
 */
export function instanceOfVerifySignatureAndCreatePass500Response(value: object): value is VerifySignatureAndCreatePass500Response {
    return true;
}

export function VerifySignatureAndCreatePass500ResponseFromJSON(json: any): VerifySignatureAndCreatePass500Response {
    return VerifySignatureAndCreatePass500ResponseFromJSONTyped(json, false);
}

export function VerifySignatureAndCreatePass500ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): VerifySignatureAndCreatePass500Response {
    if (json == null) {
        return json;
    }
    return {
        
        'error': json['error'] == null ? undefined : json['error'],
        'details': json['details'] == null ? undefined : json['details'],
    };
}

export function VerifySignatureAndCreatePass500ResponseToJSON(json: any): VerifySignatureAndCreatePass500Response {
    return VerifySignatureAndCreatePass500ResponseToJSONTyped(json, false);
}

export function VerifySignatureAndCreatePass500ResponseToJSONTyped(value?: VerifySignatureAndCreatePass500Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'error': value['error'],
        'details': value['details'],
    };
}

