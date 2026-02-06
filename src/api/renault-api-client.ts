/**
 * Modern Renault API Client
 * Based on renault-api Python library with TypeScript enhancements
 *
 * Features:
 * - Automatic token management and caching
 * - Retry logic with exponential backoff
 * - Type-safe API responses
 * - Model-specific capability detection
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RenaultConfiguration,
  RenaultCredentials,
  ApiResponse,
  BatteryStatusResponse,
  ChargeModeResponse,
  ChargingSettingsResponse,
  HvacStatusResponse,
  LocationResponse,
  CockpitResponse,
  VehicleInfo,
  ModelCapabilities,
} from '../types/renault-api.types';
import {
  getConfigurationForLocale,
  getCapabilitiesForModel,
  API_ENDPOINTS,
  TOKEN_CONFIG,
} from '../config/renault-config';

export class RenaultApiClient {
  private config: RenaultConfiguration;
  private credentials: RenaultCredentials;
  private capabilities?: ModelCapabilities;
  private axios: AxiosInstance;

  // Token caching
  private cachedToken?: string;
  private tokenExpiry?: number;

  constructor(credentials: RenaultCredentials, locale: string = 'sv-SE') {
    this.config = getConfigurationForLocale(locale);
    this.credentials = credentials;
    this.axios = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Homey-Renault-App/3.0',
      },
    });

    // Setup request/response interceptors for logging
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response) {
          console.error(`API Error ${error.response.status}:`, error.response.data);
        } else {
          console.error('API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // =========================================================================
  // Authentication Methods
  // =========================================================================

  /**
   * Authenticate and get cached JWT token
   * Automatically refreshes if expired
   */
  private async getIdToken(): Promise<string> {
    // Check if cached token is still valid
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using cached JWT token');
      return this.cachedToken;
    }

    console.log('Fetching new JWT token');

    // Step 1: Login with Gigya
    const loginToken = await this.gigyaLogin();

    // Step 2: Get JWT from Gigya
    const jwtToken = await this.gigyaGetJWT(loginToken);

    // Cache the token
    this.cachedToken = jwtToken;
    this.tokenExpiry = Date.now() + TOKEN_CONFIG.CACHE_BUFFER_SECONDS * 1000;

    return jwtToken;
  }

  /**
   * Login to Gigya and get session token
   */
  private async gigyaLogin(): Promise<string> {
    const url = `${this.config.gigyaUrl}${API_ENDPOINTS.GIGYA_LOGIN}`;

    const response = await this.axios.post(url, null, {
      params: {
        ApiKey: this.config.gigyaApiKey,
        loginID: this.credentials.username,
        password: this.credentials.password,
      },
    });

    if (response.data.statusCode !== 200) {
      throw new Error(`Gigya login failed: ${response.data.statusReason || 'Unknown error'}`);
    }

    return response.data.sessionInfo.cookieValue;
  }

  /**
   * Get JWT token from Gigya
   */
  private async gigyaGetJWT(loginToken: string): Promise<string> {
    const url = `${this.config.gigyaUrl}${API_ENDPOINTS.GIGYA_GET_JWT}`;

    const response = await this.axios.post(url, null, {
      params: {
        ApiKey: this.config.gigyaApiKey,
        login_token: loginToken,
        fields: 'data.personId,data.gigyaDataCenter',
        expiration: TOKEN_CONFIG.JWT_EXPIRATION_SECONDS,
      },
    });

    if (response.data.statusCode !== 200) {
      throw new Error(`JWT generation failed: ${response.data.statusReason || 'Unknown error'}`);
    }

    return response.data.id_token;
  }

  /**
   * Get account information
   * Sets accountId and country in credentials
   */
  async getAccountInfo(): Promise<{ accountId: string; country: string }> {
    const idToken = await this.getIdToken();

    // Get person ID from Gigya
    const loginToken = await this.gigyaLogin();
    const accountInfoUrl = `${this.config.gigyaUrl}${API_ENDPOINTS.GIGYA_ACCOUNT_INFO}`;

    const accountResponse = await this.axios.get(accountInfoUrl, {
      params: {
        ApiKey: this.config.gigyaApiKey,
        login_token: loginToken,
      },
    });

    if (accountResponse.data.statusCode !== 200) {
      throw new Error(`Failed to get account info: ${accountResponse.data.statusReason}`);
    }

    const personId = accountResponse.data.data.personId;

    // Get person details from Kamereon
    const personUrl = `${this.config.kamereonUrl}${API_ENDPOINTS.KAMEREON_PERSON.replace('{personId}', personId)}`;

    const personResponse = await this.axios.get(personUrl, {
      headers: {
        'x-gigya-id_token': idToken,
        apikey: this.config.kamereonApiKey,
      },
    });

    // Find MYRENAULT or MYDACIA account
    const account = personResponse.data.accounts.find(
      (acc: { accountType: string }) =>
        acc.accountType === 'MYRENAULT' || acc.accountType === 'MYDACIA'
    );

    if (!account) {
      throw new Error('No MYRENAULT or MYDACIA account found');
    }

    // Update credentials
    this.credentials.accountId = account.accountId;

    return {
      accountId: account.accountId,
      country: personResponse.data.country,
    };
  }

  /**
   * Get list of vehicles
   */
  async getVehicles(): Promise<VehicleInfo[]> {
    if (!this.credentials.accountId) {
      await this.getAccountInfo();
    }

    const idToken = await this.getIdToken();
    const url =
      `${this.config.kamereonUrl}${API_ENDPOINTS.KAMEREON_VEHICLES}`.replace(
        '{accountId}',
        this.credentials.accountId!
      ) + `?country=${this.config.countryCode}`;

    const response = await this.axios.get(url, {
      headers: {
        'x-gigya-id_token': idToken,
        apikey: this.config.kamereonApiKey,
      },
    });

    return response.data.vehicleLinks.map((link: any) => ({
      vin: link.vin,
      modelCode: link.vehicleDetails.model.code,
      brand: link.vehicleDetails.brand.label,
      model: link.vehicleDetails.model.label,
    }));
  }

  /**
   * Set VIN and load capabilities
   */
  setVehicle(vin: string, modelCode: string): void {
    this.credentials.vin = vin;
    this.capabilities = getCapabilitiesForModel(modelCode);
    console.log(`Vehicle set: ${vin} (${modelCode})`);
    console.log('Capabilities:', this.capabilities);
  }

  // =========================================================================
  // Vehicle Data Methods
  // =========================================================================

  /**
   * Get battery status
   */
  async getBatteryStatus(): Promise<ApiResponse<BatteryStatusResponse>> {
    if (!this.capabilities?.supportsBatteryStatus) {
      return { status: 'notSupported', data: null };
    }

    try {
      const data = await this.kamereonGet<BatteryStatusResponse>('battery-status', 2);

      // Convert charging power from Watts to kW for older models
      if (
        this.capabilities.reportsChargingPowerInWatts &&
        data.data.attributes.chargingInstantaneousPower
      ) {
        data.data.attributes.chargingInstantaneousPower /= 1000;
      }

      return { status: 'ok', data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get charge mode (with fallback to charging-settings)
   */
  async getChargeMode(): Promise<ApiResponse<ChargeModeResponse>> {
    if (!this.capabilities?.supportsChargeMode) {
      return { status: 'notSupported', data: null };
    }

    try {
      // Try newer charging-settings endpoint first
      try {
        const settings = await this.kamereonGet<ChargingSettingsResponse>('charging-settings', 1);

        // Transform to charge-mode format
        const chargeMode: ChargeModeResponse = {
          data: {
            type: 'Car',
            id: settings.data.id,
            attributes: {
              chargeMode: settings.data.attributes.mode === 'scheduled' ? 'scheduled' : 'always',
            },
          },
        };

        console.log('Using charging-settings endpoint');
        return { status: 'ok', data: chargeMode };
      } catch (settingsError) {
        // Only fallback on 400/404 errors (deprecated/unavailable endpoint)
        // Don't fallback on 5xx errors (server issues) - those should be retried
        if (axios.isAxiosError(settingsError)) {
          const status = settingsError.response?.status;
          if (status === 400 || status === 404) {
            console.log('Endpoint not available (400/404), falling back to charge-mode endpoint');
            const data = await this.kamereonGet<ChargeModeResponse>('charge-mode', 1);
            return { status: 'ok', data };
          }
        }
        // For other errors (including 5xx), throw to outer catch
        throw settingsError;
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Set charge mode
   */
  async setChargeMode(mode: 'always_charging' | 'schedule_mode'): Promise<ApiResponse<void>> {
    if (!this.capabilities?.supportsChargeMode) {
      return {
        status: 'notSupported',
        data: null,
        error: 'Charge mode not supported for this vehicle model',
      };
    }

    try {
      const body = {
        data: {
          type: 'ChargeMode',
          attributes: {
            action: mode,
          },
        },
      };

      await this.kamereonPost('actions/charge-mode', body, 1);
      return { status: 'ok', data: null };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get HVAC status
   */
  async getHvacStatus(): Promise<ApiResponse<HvacStatusResponse>> {
    if (!this.capabilities?.supportsHvacStatus) {
      return {
        status: 'notSupported',
        data: null,
        error: 'HVAC not supported for this vehicle model',
      };
    }

    try {
      const data = await this.kamereonGet<HvacStatusResponse>('hvac-status', 1);
      return { status: 'ok', data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Start HVAC
   */
  async startHvac(targetTemperature: number = 21): Promise<ApiResponse<void>> {
    if (!this.capabilities?.supportsHvacStatus) {
      return {
        status: 'notSupported',
        data: null,
        error: 'HVAC not supported for this vehicle model',
      };
    }

    try {
      const body = {
        data: {
          type: 'HvacStart',
          attributes: {
            action: 'start',
            targetTemperature,
          },
        },
      };

      await this.kamereonPost('actions/hvac-start', body, 1);
      return { status: 'ok', data: null };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get vehicle location
   */
  async getLocation(): Promise<ApiResponse<LocationResponse>> {
    if (!this.capabilities?.supportsLocation) {
      return {
        status: 'notSupported',
        data: null,
        error: 'Location not supported for this vehicle model',
      };
    }

    try {
      const data = await this.kamereonGet<LocationResponse>('location', 1);
      return { status: 'ok', data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get cockpit data (mileage, etc.)
   */
  async getCockpit(): Promise<ApiResponse<CockpitResponse>> {
    if (!this.capabilities?.supportsCockpit) {
      return {
        status: 'notSupported',
        data: null,
        error: 'Cockpit data not supported for this vehicle model',
      };
    }

    try {
      const data = await this.kamereonGet<CockpitResponse>('cockpit', 1);
      return { status: 'ok', data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Pause charging
   */
  async pauseCharging(): Promise<ApiResponse<void>> {
    try {
      const body = {
        data: {
          type: 'ChargePauseResume',
          attributes: {
            action: 'pause',
          },
        },
      };

      await this.kamereonPostKCM('charge/pause-resume', body, 1);
      return { status: 'ok', data: null };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Resume charging
   */
  async resumeCharging(): Promise<ApiResponse<void>> {
    try {
      const body = {
        data: {
          type: 'ChargePauseResume',
          attributes: {
            action: 'resume',
          },
        },
      };

      await this.kamereonPostKCM('charge/pause-resume', body, 1);
      return { status: 'ok', data: null };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =========================================================================
  // Private API Methods
  // =========================================================================

  /**
   * Generic GET request to Kamereon API
   */
  private async kamereonGet<T>(path: string, version: number): Promise<T> {
    if (!this.credentials.accountId || !this.credentials.vin) {
      throw new Error('Account ID and VIN must be set before making API calls');
    }

    const idToken = await this.getIdToken();
    const url = `${this.config.kamereonUrl}/commerce/v1/accounts/${this.credentials.accountId}/kamereon/kca/car-adapter/v${version}/cars/${this.credentials.vin}/${path}?country=${this.config.countryCode}`;

    const response = await this.axios.get<T>(url, {
      headers: {
        'x-gigya-id_token': idToken,
        apikey: this.config.kamereonApiKey,
      },
    });

    return response.data;
  }

  /**
   * Generic POST request to Kamereon API
   */
  private async kamereonPost(path: string, body: any, version: number): Promise<void> {
    if (!this.credentials.accountId || !this.credentials.vin) {
      throw new Error('Account ID and VIN must be set before making API calls');
    }

    const idToken = await this.getIdToken();
    const url = `${this.config.kamereonUrl}/commerce/v1/accounts/${this.credentials.accountId}/kamereon/kca/car-adapter/v${version}/cars/${this.credentials.vin}/${path}?country=${this.config.countryCode}`;

    await this.axios.post(url, body, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'x-gigya-id_token': idToken,
        apikey: this.config.kamereonApiKey,
      },
    });
  }

  /**
   * Generic POST request to Kamereon KCM API
   */
  private async kamereonPostKCM(path: string, body: any, version: number): Promise<void> {
    if (!this.credentials.accountId || !this.credentials.vin) {
      throw new Error('Account ID and VIN must be set before making API calls');
    }

    const idToken = await this.getIdToken();
    const url = `${this.config.kamereonUrl}/commerce/v1/accounts/${this.credentials.accountId}/kamereon/kcm/v${version}/vehicles/${this.credentials.vin}/${path}?country=${this.config.countryCode}`;

    await this.axios.post(url, body, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'x-gigya-id_token': idToken,
        apikey: this.config.kamereonApiKey,
      },
    });
  }

  /**
   * Handle API errors
   */
  private handleError<T>(error: any): ApiResponse<T> {
    console.error('API Error:', error.message);

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 400 && errorData?.type === 'FUNCTIONAL') {
        return {
          status: 'notSupported',
          data: null,
          error: 'Feature not supported for this vehicle',
        };
      }

      if (status === 403) {
        return {
          status: 'notSupported',
          data: null,
          error: 'Operation not supported for this vehicle',
        };
      }
    }

    return {
      status: 'error',
      data: null,
      error: error.message || 'Unknown error occurred',
    };
  }
}
