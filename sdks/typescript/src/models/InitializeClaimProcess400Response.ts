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
 * @interface InitializeClaimProcess400Response
 */
export interface InitializeClaimProcess400Response {
    /**
     * 
     * @type {string}
     * @memberof InitializeClaimProcess400Response
     */
    error?: string;
    /**
     * 
     * @type {string}
     * @memberof InitializeClaimProcess400Response
     */
    details?: string;
}

/**
 * Check if a given object implements the InitializeClaimProcess400Response interface.
 */
export function instanceOfInitializeClaimProcess400Response(value: object): value is InitializeClaimProcess400Response {
    return true;
}

export function InitializeClaimProcess400ResponseFromJSON(json: any): InitializeClaimProcess400Response {
    return InitializeClaimProcess400ResponseFromJSONTyped(json, false);
}

export function InitializeClaimProcess400ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): InitializeClaimProcess400Response {
    if (json == null) {
        return json;
    }
    return {
        
        'error': json['error'] == null ? undefined : json['error'],
        'details': json['details'] == null ? undefined : json['details'],
    };
}

export function InitializeClaimProcess400ResponseToJSON(json: any): InitializeClaimProcess400Response {
    return InitializeClaimProcess400ResponseToJSONTyped(json, false);
}

export function InitializeClaimProcess400ResponseToJSONTyped(value?: InitializeClaimProcess400Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'error': value['error'],
        'details': value['details'],
    };
}

