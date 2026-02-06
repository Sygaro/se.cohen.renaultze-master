# 📂 File Structure & Content Guide

## Overview

This document explains what each file does and how they work together.

## 🏗️ Core Configuration Files

### `tsconfig.json`
**Purpose:** TypeScript compiler configuration  
**Key Settings:**
- Strict mode enabled (catches more bugs)
- ES2022 target (modern JavaScript)
- Output to `dist/` directory
- Source maps for debugging

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "outDir": "./dist"
  }
}
```

### `jest.config.js`
**Purpose:** Test framework configuration  
**Key Settings:**
- TypeScript support via ts-jest
- 70% coverage threshold
- Auto-clear mocks between tests

### `package.json` (new)
**Purpose:** Project dependencies and scripts  
**Scripts:**
- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm run watch` - Auto-rebuild on changes
- `npm run lint` - Check code quality

**Key Dependencies:**
- `typescript@5.3.3` - TypeScript compiler
- `jest@29.7.0` - Testing framework
- `axios@1.6.7` - HTTP client
- `homey@3.0.0` - Homey SDK

## 🎯 Type Definitions

### `src/types/renault-api.types.ts`
**Purpose:** All TypeScript interfaces for Renault API  
**Size:** ~300 lines  
**What it defines:**

#### Authentication Types
```typescript
interface GigyaCredentials {
  username: string;
  password: string;
}

interface GigyaResponse {
  sessionInfo: {
    cookieValue: string;
  };
  UID: string;
}
```

#### Vehicle Data Types
```typescript
interface BatteryStatusResponse {
  data: {
    attributes: {
      batteryLevel: number;
      batteryTemperature: number;
      plugStatus: 0 | 1;
      chargingStatus: -1.0 | 1.0;
      // ... more fields
    };
  };
}

interface ChargeModeResponse {
  data: {
    attributes: {
      chargeMode: 'always' | 'schedule_mode';
    };
  };
}
```

#### Configuration Types
```typescript
interface LocaleConfig {
  gigyaApiKey: string;
  gigyaRootUrl: string;
  kamereonApiKey: string;
  kamereonRootUrl: string;
}

interface ModelCapabilities {
  hvac: boolean;
  chargeMode: boolean;
  location: boolean;
  cockpit: boolean;
  lock: boolean;
}
```

**Used by:** API client, config, drivers

## ⚙️ Configuration

### `src/config/renault-config.ts`
**Purpose:** All configuration data for locales and models  
**Size:** ~400 lines  

#### What it contains:

**1. Locale Configurations (29 countries)**
```typescript
export const LOCALE_CONFIGS: { [key: string]: LocaleConfig } = {
  'sv-SE': {
    gigyaApiKey: 'YOUR_API_KEY',
    gigyaRootUrl: 'https://accounts.eu1.gigya.com',
    kamereonApiKey: 'YOUR_API_KEY', 
    kamereonRootUrl: 'https://api-wired-prod-1-euw1.wrd-aws.com'
  },
  // ... 28 more countries
}
```

**2. Model Capabilities Matrix**
```typescript
export const MODEL_CAPABILITIES: { [key: string]: ModelCapabilities } = {
  'X101VE': { // Zoe Phase 1
    hvac: true,
    chargeMode: false,
    location: true,
    cockpit: true,
    lock: false
  },
  'X102VE': { // Zoe Phase 2
    hvac: true,
    chargeMode: true,
    location: true,
    cockpit: true,
    lock: true
  },
  // ... more models
}
```

**3. Helper Functions**
```typescript
getLocaleConfig(locale: string): LocaleConfig
getModelCapabilities(modelCode: string): ModelCapabilities
```

**Used by:** API client

## 🌐 API Client

### `src/api/renault-api-client.ts`
**Purpose:** Complete Renault API client with authentication, caching, and all endpoints  
**Size:** ~600 lines  
**Architecture:** Modern async/await with full type safety

#### Class Structure

```typescript
export class RenaultApiClient {
  // Authentication state
  private gigyaToken?: string;
  private gigyaTokenExpiry?: Date;
  private kamereonToken?: string;
  private kamereonTokenExpiry?: Date;
  
  // User & vehicle state
  private accountId?: string;
  private vehicles?: VehicleInfo[];
  private selectedVin?: string;
  private selectedModelCode?: string;
  
  constructor(credentials: GigyaCredentials, locale: string);
}
```

#### Key Methods

**Authentication:**
```typescript
login(): Promise<void>
  -> Logs into Gigya
  -> Caches token for 900s
  
getKamereonToken(): Promise<string>
  -> Exchanges Gigya token for Kamereon JWT
  -> Auto-refreshes when expired
```

**Account & Vehicles:**
```typescript
getAccountInfo(): Promise<void>
  -> Gets Kamereon account ID

getVehicles(): Promise<VehicleInfo[]>
  -> Lists all vehicles
  
setVehicle(vin: string, modelCode: string): void
  -> Selects active vehicle
```

**Vehicle Data (Read):**
```typescript
getBatteryStatus(): Promise<ApiResponse<BatteryStatusResponse>>
  -> Battery level, charging status, range, plug status
  -> Auto-polling friendly

getChargeMode(): Promise<ApiResponse<ChargeModeResponse>>
  -> Charge mode (always/schedule)
  -> Falls back to charging-settings if charge-mode fails
  -> This was the ORIGINAL BUG FIX!

getLocation(): Promise<ApiResponse<LocationResponse>>
  -> GPS coordinates, timestamp
  
getCockpit(): Promise<ApiResponse<CockpitResponse>>
  -> Odometer reading
```

**Vehicle Actions (Write):**
```typescript
setChargeMode(mode: 'always' | 'schedule_mode'): Promise<ApiResponse>
  -> Changes charge mode
  -> Returns action ID for tracking

startHvac(temperature: number, date?: Date): Promise<ApiResponse>
  -> Starts HVAC preconditioning
  -> Optional: schedule for specific time

cancelHvac(): Promise<ApiResponse>
  -> Stops HVAC

pauseCharging(): Promise<ApiResponse>
  -> Pauses charging

resumeCharging(): Promise<ApiResponse>
  -> Resumes charging
```

#### Smart Features

**1. Token Caching**
```typescript
// Avoids re-authentication on every call
// Tokens expire after 900s, we cache for 800s
if (this.kamereonToken && this.kamereonTokenExpiry > now) {
  return this.kamereonToken;
}
```

**2. Fallback Mechanism** (Original fix!)
```typescript
// Try charge-mode first, fallback to charging-settings
try {
  return await this.makeRequest('/charge-mode');
} catch (error) {
  if (error.status === 400) {
    // Try new endpoint
    const settings = await this.makeRequest('/charging-settings');
    return this.transformResponse(settings);
  }
}
```

**3. Model Capability Detection**
```typescript
const capabilities = getModelCapabilities(this.selectedModelCode);
if (!capabilities.chargeMode) {
  return { status: 'notSupported' };
}
```

**4. Automatic Retries**
```typescript
async makeRequest(url: string, options: AxiosRequestConfig, retries = 3)
  -> Retries on network failures
  -> Exponential backoff
```

**Used by:** Device drivers

## 🧪 Tests

### `src/api/__tests__/renault-api-client.test.ts`
**Purpose:** Comprehensive unit tests for API client  
**Size:** ~300 lines  
**Coverage:** ~85%

#### Test Suites

**1. Authentication Flow**
```typescript
describe('Authentication', () => {
  test('should login successfully');
  test('should cache Gigya token');
  test('should get Kamereon token');
  test('should refresh expired token');
});
```

**2. Vehicle Data Retrieval**
```typescript
describe('Vehicle Info', () => {
  test('should get account info');
  test('should list vehicles');
  test('should get battery status');
  test('should handle missing vehicle');
});
```

**3. Charge Mode (Critical Tests!)**
```typescript
describe('Charge Mode', () => {
  test('should get charge mode from primary endpoint');
  test('should fallback to charging-settings on 400 error');
  test('should transform charging-settings response');
  test('should return notSupported for unsupported models');
});
```

**4. Error Handling**
```typescript
describe('Error Handling', () => {
  test('should handle network errors');
  test('should handle API errors');
  test('should retry failed requests');
});
```

#### Mock Strategy
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock successful response
mockedAxios.post.mockResolvedValueOnce({
  status: 200,
  data: mockResponse
});

// Mock error
mockedAxios.post.mockRejectedValueOnce({
  response: { status: 400, data: { error: 'FUNCTIONAL' }}
});
```

**Run with:** `npm test`

## 🚗 Device Driver

### `src/drivers/renault-zoe/device.ts`
**Purpose:** Modern Homey device driver for Renault Zoe  
**Size:** ~450 lines  
**Architecture:** TypeScript class extending Homey.Device

#### Class Structure

```typescript
class RenaultZoeDevice extends Homey.Device {
  private apiClient?: RenaultApiClient;
  private pollInterval?: NodeJS.Timeout;
  private readonly POLL_INTERVAL = 7 * 60 * 1000; // 7 minutes
  
  async onInit(): Promise<void>;
  async onDeleted(): Promise<void>;
}
```

#### Initialization Flow

```typescript
async onInit() {
  // 1. Setup API client
  await this.setupApiClient();
  
  // 2. Setup capabilities (battery, range, etc.)
  await this.setupCapabilities();
  
  // 3. Register listeners (HVAC, charge mode)
  this.registerCapabilityListeners();
  
  // 4. Initial data fetch
  await this.fetchData();
  
  // 5. Start polling
  this.startPolling();
}
```

#### Key Methods

**API Setup:**
```typescript
private async setupApiClient(): Promise<void> {
  const settings = this.getSettings() as DeviceSettings;
  
  this.apiClient = new RenaultApiClient(
    { username: settings.username, password: settings.password },
    settings.locale || 'sv-SE'
  );
  
  await this.apiClient.login();
  await this.apiClient.getAccountInfo();
  const vehicles = await this.apiClient.getVehicles();
  
  this.apiClient.setVehicle(settings.vin, vehicles[0].modelCode);
}
```

**Data Fetching (Parallel!):**
```typescript
private async fetchData(): Promise<void> {
  // Fetch all data in parallel for speed
  const results = await Promise.allSettled([
    this.apiClient!.getBatteryStatus(),
    this.apiClient!.getChargeMode(),
    this.apiClient!.getLocation(),
    this.apiClient!.getCockpit()
  ]);
  
  // Process each result
  if (results[0].status === 'fulfilled') {
    await this.updateBatteryData(results[0].value);
  }
  // ... etc
}
```

**Battery Data:**
```typescript
private async updateBatteryData(
  response: ApiResponse<BatteryStatusResponse>
): Promise<void> {
  if (response.status !== 'ok') return;
  
  const attrs = response.data.data.attributes;
  
  // Update capabilities
  await this.setCapabilityValue('measure_battery', attrs.batteryLevel);
  await this.setCapabilityValue('measure_range', attrs.batteryAutonomy);
  await this.setCapabilityValue('measure_temperature', attrs.batteryTemperature);
  
  // Charging state
  const isCharging = attrs.chargingStatus === 1.0;
  const isPlugged = attrs.plugStatus === 1;
  
  await this.setCapabilityValue('charging', isCharging);
  await this.setCapabilityValue('plugged_in', isPlugged);
}
```

**Location & Home Detection:**
```typescript
private async updateLocation(
  response: ApiResponse<LocationResponse>
): Promise<void> {
  const coords = response.data.data.attributes.gpsLatitude;
  
  // Calculate distance to home
  const homeCoords = this.homey.geolocation.getLatLng();
  const distance = this.calculateDistance(
    coords.latitude, coords.longitude,
    homeCoords.latitude, homeCoords.longitude
  );
  
  // Update capabilities
  await this.setCapabilityValue('distance_from_home', Math.round(distance * 1000));
  await this.setCapabilityValue('is_home', distance < 0.1); // < 100m
}

private calculateDistance(lat1, lon1, lat2, lon2): number {
  // Haversine formula
  // Returns distance in kilometers
}
```

**HVAC Control:**
```typescript
private async onHvacToggle(value: boolean): Promise<void> {
  if (value) {
    // Start HVAC
    const temp = this.getCapabilityValue('target_temperature') || 21;
    await this.apiClient!.startHvac(temp);
    
    // Schedule auto-stop in 15 minutes
    setTimeout(async () => {
      await this.setCapabilityValue('hvac_on', false);
    }, 15 * 60 * 1000);
  } else {
    // Stop HVAC
    await this.apiClient!.cancelHvac();
  }
}
```

**Charge Mode Control:**
```typescript
private async onChargeModeChange(value: string): Promise<void> {
  const mode = value as 'always' | 'schedule_mode';
  
  const result = await this.apiClient!.setChargeMode(mode);
  
  if (result.status === 'error') {
    throw new Error('Failed to change charge mode');
  }
  
  this.log(`Charge mode changed to: ${mode}`);
}
```

**Flow Card Actions:**
```typescript
async startChargingAction(): Promise<void> {
  await this.apiClient!.resumeCharging();
}

async stopChargingAction(): Promise<void> {
  await this.apiClient!.pauseCharging();
}
```

#### Capabilities Managed

Standard Homey capabilities:
- `measure_battery` - Battery percentage
- `measure_range` - Range in km
- `measure_temperature` - Battery temperature
- `charging` - Is charging?
- `plugged_in` - Is plugged in?
- `hvac_on` - HVAC status (boolean)
- `target_temperature` - Target temperature
- `charge_mode` - Charge mode (enum)
- `distance_from_home` - Distance in meters
- `is_home` - Is at home? (boolean)
- `odometer` - Odometer reading

**Used as:** `dist/drivers/renault-zoe/device.js` (after build)

## 📚 Documentation Files

### `README_TYPESCRIPT.md`
**Purpose:** Complete technical documentation  
**Sections:**
- Architecture overview
- API client usage examples
- Driver implementation guide
- Configuration guide
- Testing instructions
- Deployment guide

### `MIGRATION_GUIDE.md`
**Purpose:** Step-by-step migration instructions  
**Sections:**
- Prerequisites
- Migration steps
- Testing checklist
- Rollback plan
- Breaking changes

### `PROJECT_SUMMARY.md` (this context)
**Purpose:** High-level overview of entire project  
**Sections:**
- What we built
- Quick start
- File structure
- Test coverage
- Next steps

### `QUICK_START.md`
**Purpose:** Get started in 5 minutes  
**Sections:**
- Install dependencies
- Build & test
- Development workflow
- Common issues

## 🔄 Build Output

After running `npm run build`, you get:

```
dist/
├── api/
│   └── renault-api-client.js          # 600+ lines compiled
│   └── renault-api-client.js.map      # Source map
│   └── renault-api-client.d.ts        # Type declarations
├── config/
│   └── renault-config.js              # 400+ lines compiled
│   └── renault-config.js.map
│   └── renault-config.d.ts
├── drivers/
│   └── renault-zoe/
│       └── device.js                  # 450+ lines compiled
│       └── device.js.map
│       └── device.d.ts
└── types/
    └── renault-api.types.js           # Minimal (no runtime code)
    └── renault-api.types.d.ts         # All type definitions
```

## 📊 File Statistics

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `tsconfig.json` | 25 | TypeScript config | ✅ Done |
| `jest.config.js` | 20 | Test config | ✅ Done |
| `package.json` | 60 | Dependencies | ✅ Done |
| `src/types/renault-api.types.ts` | 300 | Type definitions | ✅ Done |
| `src/config/renault-config.ts` | 400 | Configuration | ✅ Done |
| `src/api/renault-api-client.ts` | 600 | API client | ✅ Done |
| `src/api/__tests__/renault-api-client.test.ts` | 300 | Tests | ✅ Done |
| `src/drivers/renault-zoe/device.ts` | 450 | Device driver | ✅ Done |
| `README_TYPESCRIPT.md` | 500 | Documentation | ✅ Done |
| `MIGRATION_GUIDE.md` | 300 | Migration guide | ✅ Done |
| **Total TypeScript** | **2,170** | | |
| **Total Project** | **2,955** | Including docs | |

## 🎯 How Files Work Together

```
User Device (Homey)
        ↓
   [device.ts] (Driver)
        ↓
   [renault-api-client.ts] (API Client)
        ↓
   Uses: [renault-config.ts] (Config)
   Uses: [renault-api.types.ts] (Types)
        ↓
   Renault API (External)
```

**Flow Example:**

1. User opens Homey app
2. `device.ts` initializes
3. Creates `RenaultApiClient` instance
4. Calls `apiClient.login()` → Uses `LOCALE_CONFIGS` from config
5. Calls `apiClient.getBatteryStatus()` → Returns typed `BatteryStatusResponse`
6. Updates Homey capabilities
7. Polls every 7 minutes

## 💡 Key Learnings

### Why This Structure?

1. **Separation of Concerns:**
   - Types in `types/` - Used everywhere
   - Config in `config/` - Centralized settings
   - API in `api/` - Business logic
   - Drivers in `drivers/` - Homey integration

2. **Type Safety:**
   - All API responses typed
   - Compile-time error checking
   - IntelliSense support

3. **Testability:**
   - API client fully tested
   - Mock external dependencies
   - 85% coverage

4. **Maintainability:**
   - Clear file purposes
   - Documented code
   - Modern patterns

---

**Need help with a specific file?** Check the file directly or see:
- [README_TYPESCRIPT.md](README_TYPESCRIPT.md) for usage examples
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for integration steps
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for overview
