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


import * as runtime from '../runtime';
import type {
  CheckApiHealth200Response,
} from '../models/index';
import {
    CheckApiHealth200ResponseFromJSON,
    CheckApiHealth200ResponseToJSON,
} from '../models/index';

/**
 * 
 */
export class HealthApi extends runtime.BaseAPI {

    /**
     * Returns the health status of the API
     * Check API health
     */
    async checkApiHealthRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CheckApiHealth200Response>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["X-API-KEY"] = await this.configuration.apiKey("X-API-KEY"); // ApiKeyAuth authentication
        }


        let urlPath = `/health`;

        const response = await this.request({
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CheckApiHealth200ResponseFromJSON(jsonValue));
    }

    /**
     * Returns the health status of the API
     * Check API health
     */
    async checkApiHealth(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CheckApiHealth200Response> {
        const response = await this.checkApiHealthRaw(initOverrides);
        return await response.value();
    }

}
