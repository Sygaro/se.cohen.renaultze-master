/**
 * Renault API Configuration
 * Based on official Renault API endpoints
 * Source: renault-api Python library
 */

import { RenaultConfiguration, ModelCode, ModelCapabilities } from '../types/renault-api.types';

/**
 * Renault API endpoints configuration per country
 * Extracted from: https://renault-wrd-prod-1-euw1-myrapp-one.s3-eu-west-1.amazonaws.com/configuration/android/config_<locale>.json
 */
export const RENAULT_CONFIGURATIONS: Record<string, RenaultConfiguration> = {
  // Nordic countries
  'sv-SE': {
    countryCode: 'SE',
    locale: 'sv-SE',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_EN5Hcnwanu9_Dqot1v1Aky1YelT5QqG4TxveO0EgKFWZYu03WkeB9FKuKKIWUXIS',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'nb-NO': {
    countryCode: 'NO',
    locale: 'nb-NO',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_QrPkEJr69l7rHkdCVls0owC80BB4CGz5xw_b0gBSNdn3pL04wzMBkcwtbeKdl1g9',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'da-DK': {
    countryCode: 'DK',
    locale: 'da-DK',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_5x-2C8b1R4MJPQXkwTPdIqgBpcw653Dakw_ZaEneQRkTBdg9UW9Qg_5G-tMNrTMc',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'fi-FI': {
    countryCode: 'FI',
    locale: 'fi-FI',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_xSRCLDYhk1SwSeYQLI3DmA8t-etfAfu5un51fws125ANOBZHgh8Lcc4ReWSwaqNY',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  
  // Western Europe
  'en-GB': {
    countryCode: 'GB',
    locale: 'en-GB',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_e8d4g4SE_Fo8ahyHwwP7ohLGZ79HKNN2T8NjQqoNnk6Epj6ilyYwKdHUyCw3wuxz',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'de-DE': {
    countryCode: 'DE',
    locale: 'de-DE',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_7PLksOyBRkHv126x5WhHb-5pqC1qFR8pQjxSeLB6nhAnPERTUlwnYoznHSxwX668',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'fr-FR': {
    countryCode: 'FR',
    locale: 'fr-FR',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_4LKbCcMMcvjDm3X89LU4z4mNKYKdl_W0oD9w-Jvih21WqgJKtFZAnb9YdUgWT9_a',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'nl-NL': {
    countryCode: 'NL',
    locale: 'nl-NL',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_ZIOtjqmP0zaHdEnPK7h1xPuBYgtcOyUxbsTY8Gw31Fzy7i7Ltjfm-hhPh23fpHT5',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'it-IT': {
    countryCode: 'IT',
    locale: 'it-IT',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_js8th3jdmCWV86fKR3SXQWvXGKbHoWFv8NAgRbH7FnIBsi_XvCpN_rtLcI07uNuq',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
  'es-ES': {
    countryCode: 'ES',
    locale: 'es-ES',
    gigyaUrl: 'https://accounts.eu1.gigya.com',
    gigyaApiKey: '3_DyMiOwEaxLcPdBTu63Gv3hlhvLaLbW3ufvjHLeuU8U5bx3zx19t5rEKq7KMwk9f1',
    kamereonUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com',
    kamereonApiKey: 'YjkKtHmGfaceeuExUDKGxrLZGGvtVS0J',
  },
};

/**
 * Model-specific capabilities
 * Defines which features are supported by each vehicle model
 */
export const MODEL_CAPABILITIES: Record<ModelCode, ModelCapabilities> = {
  [ModelCode.ZOE_PHASE1]: {
    supportsBatteryStatus: true,
    supportsCockpit: false,
    supportsHvacStatus: true, // But may always report 'off'
    supportsChargeMode: true,
    supportsLocation: false,
    supportsFuelStatus: false,
    reportsChargingPowerInWatts: true,
  },
  [ModelCode.ZOE_PHASE2]: {
    supportsBatteryStatus: true,
    supportsCockpit: true,
    supportsHvacStatus: false, // Returns 403 error
    supportsChargeMode: true,
    supportsLocation: true,
    supportsFuelStatus: false,
    reportsChargingPowerInWatts: false, // Reports in kW
  },
  [ModelCode.MEGANE_ETECH]: {
    supportsBatteryStatus: true,
    supportsCockpit: true,
    supportsHvacStatus: true,
    supportsChargeMode: true,
    supportsLocation: true,
    supportsFuelStatus: false,
    reportsChargingPowerInWatts: false,
  },
  [ModelCode.DACIA_SPRING]: {
    supportsBatteryStatus: true,
    supportsCockpit: true,
    supportsHvacStatus: true,
    supportsChargeMode: false, // Dacia Spring not supported
    supportsLocation: true,
    supportsFuelStatus: false,
    reportsChargingPowerInWatts: false,
  },
  [ModelCode.KANGOO_EV]: {
    supportsBatteryStatus: false, // Returns errors
    supportsCockpit: false,
    supportsHvacStatus: false,
    supportsChargeMode: false,
    supportsLocation: false,
    supportsFuelStatus: true, // Hybrid model
    reportsChargingPowerInWatts: false,
  },
};

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Gigya endpoints
  GIGYA_LOGIN: '/accounts.login',
  GIGYA_ACCOUNT_INFO: '/accounts.getAccountInfo',
  GIGYA_GET_JWT: '/accounts.getJWT',
  
  // Kamereon endpoints
  KAMEREON_PERSON: '/commerce/v1/persons/{personId}',
  KAMEREON_VEHICLES: '/commerce/v1/accounts/{accountId}/vehicles',
  
  // Vehicle data endpoints (KCA - Kamereon Car Adapter)
  BATTERY_STATUS: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v2/cars/{vin}/battery-status',
  COCKPIT: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/cockpit',
  HVAC_STATUS: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/hvac-status',
  LOCATION: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/location',
  CHARGE_MODE: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/charge-mode',
  CHARGING_SETTINGS: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/charging-settings',
  
  // Action endpoints
  ACTION_HVAC_START: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/actions/hvac-start',
  ACTION_CHARGE_MODE: '/commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/actions/charge-mode',
  
  // KCM endpoints (newer)
  KCM_CHARGE_PAUSE_RESUME: '/commerce/v1/accounts/{accountId}/kamereon/kcm/v1/vehicles/{vin}/charge/pause-resume',
  KCM_EV_SETTINGS: '/commerce/v1/accounts/{accountId}/kamereon/kcm/v1/vehicles/{vin}/ev/settings',
} as const;

/**
 * Token expiration settings
 */
export const TOKEN_CONFIG = {
  JWT_EXPIRATION_SECONDS: 900, // 15 minutes
  CACHE_BUFFER_SECONDS: 100, // Cache for 100 seconds less to be safe
} as const;

/**
 * Retry configuration for API calls
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Get configuration for a specific locale
 */
export function getConfigurationForLocale(locale: string): RenaultConfiguration {
  const normalizedLocale = locale.replace('_', '-');
  
  // Handle legacy locale codes
  const localeAliases: Record<string, string> = {
    'no-NO': 'nb-NO', // Legacy Norwegian code → Norwegian Bokmål
  };
  
  const finalLocale = localeAliases[normalizedLocale] || normalizedLocale;
  const config = RENAULT_CONFIGURATIONS[finalLocale];
  
  if (!config) {
    throw new Error(`No configuration found for locale: ${locale}. Available locales: ${Object.keys(RENAULT_CONFIGURATIONS).join(', ')}`);
  }
  
  return config;
}

/**
 * Get capabilities for a specific model
 */
export function getCapabilitiesForModel(modelCode: string): ModelCapabilities {
  const capabilities = MODEL_CAPABILITIES[modelCode as ModelCode];
  
  if (!capabilities) {
    // Return default capabilities for unknown models
    console.warn(`Unknown model code: ${modelCode}. Using default capabilities.`);
    return {
      supportsBatteryStatus: true,
      supportsCockpit: true,
      supportsHvacStatus: true,
      supportsChargeMode: true,
      supportsLocation: true,
      supportsFuelStatus: false,
      reportsChargingPowerInWatts: false,
    };
  }
  
  return capabilities;
}
