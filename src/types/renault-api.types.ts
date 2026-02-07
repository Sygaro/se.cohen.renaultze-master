/**
 * Type definitions for Renault API
 * Based on renault-api Python library and Renault API documentation
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface RenaultConfiguration {
  countryCode: string;
  locale: string;
  gigyaUrl: string;
  gigyaApiKey: string;
  kamereonUrl: string;
  kamereonApiKey: string;
}

export interface RenaultCredentials {
  username: string;
  password: string;
  accountId?: string;
  vin?: string;
}

// ============================================================================
// Authentication Types (Gigya)
// ============================================================================

export interface GigyaLoginResponse {
  statusCode: number;
  statusReason?: string;
  sessionInfo: {
    cookieValue: string;
  };
}

export interface GigyaAccountInfoResponse {
  statusCode: number;
  statusReason?: string;
  data: {
    personId: string;
  };
}

export interface GigyaJWTResponse {
  statusCode: number;
  statusReason?: string;
  id_token: string;
}

// ============================================================================
// Kamereon Person & Account Types
// ============================================================================

export interface KamereonAccount {
  accountId: string;
  accountType: 'MYRENAULT' | 'MYDACIA';
  accountStatus: string;
  country: string;
  relationType: string;
}

export interface KamereonPersonResponse {
  accounts: KamereonAccount[];
  country: string;
  locale: string;
}

// ============================================================================
// Vehicle Types
// ============================================================================

export interface VehicleDetails {
  brand: {
    label: string;
  };
  model: {
    code: string;
    label: string;
  };
  registrationNumber?: string;
  registrationDate?: string;
}

export interface VehicleLink {
  vin: string;
  vehicleDetails: VehicleDetails;
  status: string;
}

export interface VehicleInfo {
  vin: string;
  modelCode: string;
  brand: string;
  model: string;
}

// ============================================================================
// Battery Status Types
// ============================================================================

export interface BatteryStatusData {
  timestamp: string;
  batteryLevel: number; // Percentage 0-100
  batteryTemperature?: number; // Celsius
  batteryAutonomy: number; // km
  batteryCapacity: number; // kWh (often returns 0)
  batteryAvailableEnergy: number; // kWh
  plugStatus: 0 | 1; // 0=unplugged, 1=plugged
  chargingStatus: -1.0 | 0.0 | 1.0; // -1=error, 0=not charging, 1=charging
  chargingRemainingTime?: number; // minutes
  chargingInstantaneousPower?: number; // kW or W depending on model
}

export interface BatteryStatusResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: BatteryStatusData;
  };
}

// ============================================================================
// Charging Types
// ============================================================================

export type ChargeMode = 'always' | 'scheduled' | 'always_charging' | 'schedule_mode';

export interface ChargeModeData {
  chargeMode: ChargeMode;
}

export interface ChargeModeResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: ChargeModeData;
  };
}

export interface ChargingSchedule {
  id: number;
  activated: boolean;
  monday?: { startTime: string; duration: number };
  tuesday?: { startTime: string; duration: number };
  wednesday?: { startTime: string; duration: number };
  thursday?: { startTime: string; duration: number };
  friday?: { startTime: string; duration: number };
  saturday?: { startTime: string; duration: number };
  sunday?: { startTime: string; duration: number };
}

export interface ChargingSettingsData {
  mode: 'always' | 'scheduled';
  schedules: ChargingSchedule[];
}

export interface ChargingSettingsResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: ChargingSettingsData;
  };
}

// ============================================================================
// HVAC Types
// ============================================================================

export interface HvacStatusData {
  externalTemperature?: number; // Celsius
  socThreshold?: number; // Minimum battery % to run HVAC
  hvacStatus: 'on' | 'off' | 'pending';
  lastUpdateTime?: string;
}

export interface HvacStatusResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: HvacStatusData;
  };
}

// ============================================================================
// Location Types
// ============================================================================

export interface LocationData {
  gpsLatitude: number;
  gpsLongitude: number;
  gpsDirection?: number | null;
  lastUpdateTime: string;
}

export interface LocationResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: LocationData;
  };
}

// ============================================================================
// Cockpit Types
// ============================================================================

export interface CockpitData {
  totalMileage: number; // km
  fuelAutonomy?: number; // km (for hybrid vehicles)
  fuelQuantity?: number; // liters (for hybrid vehicles)
}

export interface CockpitResponse {
  data: {
    type: 'Car';
    id: string;
    attributes: CockpitData;
  };
}

// ============================================================================
// Action Types
// ============================================================================

export interface ChargeModeAction {
  data: {
    type: 'ChargeMode';
    attributes: {
      action: 'always_charging' | 'schedule_mode';
    };
  };
}

export interface HvacStartAction {
  data: {
    type: 'HvacStart';
    attributes: {
      action: 'start' | 'cancel';
      targetTemperature?: number;
    };
  };
}

export interface ChargePauseResumeAction {
  data: {
    type: 'ChargePauseResume';
    attributes: {
      action: 'pause' | 'resume';
    };
  };
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  status: 'ok' | 'error' | 'notSupported';
  data: T | null;
  error?: string;
}

// ============================================================================
// Model Support Matrix
// ============================================================================

export enum ModelCode {
  ZOE_PHASE1 = 'X101VE',
  ZOE_PHASE2 = 'X102VE',
  MEGANE_ETECH = 'XCB1VE',
  DACIA_SPRING = 'XBG1VE',
  KANGOO_EV = 'XJA1VP',
}

export interface ModelCapabilities {
  supportsBatteryStatus: boolean;
  supportsCockpit: boolean;
  supportsHvacStatus: boolean;
  supportsChargeMode: boolean;
  supportsLocation: boolean;
  supportsFuelStatus: boolean;
  reportsChargingPowerInWatts: boolean;
}
