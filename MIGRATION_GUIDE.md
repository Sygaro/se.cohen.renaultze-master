/**
 * Migration Guide: JavaScript to TypeScript
 * How to gradually migrate existing code to TypeScript
 */

# Migration Strategy

## Phase 1: Setup (✅ Completed)

- [x] Install TypeScript and dependencies
- [x] Create tsconfig.json
- [x] Setup Jest for testing
- [x] Configure ESLint
- [x] Create type definitions
- [x] Build API client in TypeScript

## Phase 2: Gradual Migration

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

This will compile `src/*.ts` → `dist/*.js`

### Step 3: Update app.js to use compiled code

**Option A: Keep existing app.js, import compiled modules**

```javascript
// app.js (stays as JavaScript)
'use strict';

const Homey = require('homey');
const { RenaultApiClient } = require('./dist/api/renault-api-client');

class RenaultApp extends Homey.App {
  async onInit() {
    this.log('Renault App v3.0 initialized');
    
    // Use TypeScript compiled client
    // ...
  }
}

module.exports = RenaultApp;
```

**Option B: Migrate app.js to TypeScript**

```typescript
// src/app.ts
import Homey from 'homey';
import { RenaultApiClient } from './api/renault-api-client';

class RenaultApp extends Homey.App {
  async onInit(): Promise<void> {
    this.log('Renault App v3.0 initialized');
  }
}

export = RenaultApp;
```

Then compile and copy:
```bash
npm run build
cp dist/app.js ./app.js
```

### Step 4: Migrate Drivers One at a Time

#### Before (JavaScript):
```javascript
// drivers/renault-zoe/device.js
'use strict';

const Homey = require('homey');
const api = require('../../lib/api');

class RenaultZoeDevice extends Homey.Device {
  async onInit() {
    this.log('Device initialized');
    let renaultApi = new api.RenaultApi(this.getSettings());
    // ...
  }
}

module.exports = RenaultZoeDevice;
```

#### After (TypeScript):
```typescript
// src/drivers/renault-zoe/device.ts
import Homey from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';

class RenaultZoeDevice extends Homey.Device {
  private api?: RenaultApiClient;
  private pollingInterval?: NodeJS.Timeout;

  async onInit(): Promise<void> {
    this.log('Device initialized');
    
    const settings = this.getSettings();
    this.api = new RenaultApiClient(
      {
        username: settings.username,
        password: settings.password,
        accountId: settings.accountId,
        vin: settings.vin,
      },
      settings.locale || 'sv-SE'
    );
    
    // Set vehicle with model detection
    this.api.setVehicle(settings.vin, settings.modelCode);
    
    await this.setupCapabilities();
    await this.fetchData();
    
    // Poll every 7 minutes
    this.pollingInterval = setInterval(() => {
      this.fetchData();
    }, 420000);
  }

  private async setupCapabilities(): Promise<void> {
    // Add capabilities if missing
    if (!this.hasCapability('measure_battery')) {
      await this.addCapability('measure_battery');
    }
    // ... more capabilities
  }

  private async fetchData(): Promise<void> {
    if (!this.api) return;
    
    try {
      // Get battery status
      const battery = await this.api.getBatteryStatus();
      if (battery.status === 'ok' && battery.data) {
        await this.setCapabilityValue(
          'measure_battery',
          battery.data.data.attributes.batteryLevel
        );
        await this.setCapabilityValue(
          'measure_batteryAutonomy',
          battery.data.data.attributes.batteryAutonomy
        );
      }

      // Get charge mode
      const chargeMode = await this.api.getChargeMode();
      if (chargeMode.status === 'ok' && chargeMode.data) {
        const mode = chargeMode.data.data.attributes.chargeMode;
        await this.setCapabilityValue(
          'charge_mode',
          mode === 'scheduled' || mode === 'schedule_mode'
            ? 'schedule_mode'
            : 'always_charging'
        );
      }

      // Get location
      const location = await this.api.getLocation();
      if (location.status === 'ok' && location.data) {
        const { gpsLatitude, gpsLongitude } = location.data.data.attributes;
        // Calculate home distance, etc.
      }
    } catch (error) {
      this.error('Failed to fetch data:', error);
    }
  }

  async onDeleted(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}

export = RenaultZoeDevice;
```

Then compile:
```bash
npm run build
cp dist/drivers/renault-zoe/device.js drivers/renault-zoe/device.js
```

## Phase 3: Testing

### Write Tests Before Migration

```typescript
// src/drivers/renault-zoe/__tests__/device.test.ts
import RenaultZoeDevice from '../device';
import { RenaultApiClient } from '../../../api/renault-api-client';

jest.mock('../../../api/renault-api-client');

describe('RenaultZoeDevice', () => {
  let device: RenaultZoeDevice;

  beforeEach(() => {
    device = new RenaultZoeDevice();
    // Mock Homey methods
    device.log = jest.fn();
    device.error = jest.fn();
    device.getSettings = jest.fn().mockReturnValue({
      username: 'test@example.com',
      password: 'password',
      vin: 'TEST123',
      modelCode: 'X102VE',
      locale: 'sv-SE',
    });
  });

  it('should initialize correctly', async () => {
    await device.onInit();
    expect(device.log).toHaveBeenCalledWith('Device initialized');
  });

  it('should fetch battery data', async () => {
    const mockBattery = {
      status: 'ok' as const,
      data: {
        data: {
          type: 'Car' as const,
          id: 'TEST123',
          attributes: {
            batteryLevel: 75,
            batteryAutonomy: 250,
            timestamp: '2026-02-06T12:00:00Z',
            batteryCapacity: 52,
            batteryAvailableEnergy: 40,
            plugStatus: 0 as 0 | 1,
            chargingStatus: 0 as -1.0 | 0.0 | 1.0,
          },
        },
      },
    };

    (RenaultApiClient.prototype.getBatteryStatus as jest.Mock)
      .mockResolvedValue(mockBattery);

    await (device as any).fetchData();

    expect(device.setCapabilityValue).toHaveBeenCalledWith('measure_battery', 75);
  });
});
```

Run tests:
```bash
npm test
```

## Phase  4: Deployment

### Option 1: Parallel Development

Keep both versions:
- `lib/api.js` - Old version (deprecated)
- `dist/api/renault-api-client.js` - New version

Gradually switch drivers to use new API.

### Option 2: Clean Break

1. Remove old `lib/` directory
2. Update all drivers at once
3. Thorough testing
4. Release as v3.0.0

## CI/CD Integration

Add to `.github/workflows/build.yml`:

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npm run validate
```

## Rollback Plan

If issues arise:

1. Keep backup of working JavaScript version
2. Git tag stable versions
3. Ability to quickly revert:

```bash
git revert HEAD
git push
```

## Benefits After Migration

✅ Type safety catches errors at compile time
✅ Better IDE autocomplete and intellisense
✅ Easier refactoring
✅ Self-documenting code
✅ Better test coverage
✅ Modern development experience

## Common Pitfalls

❌ Don't forget to compile before testing
❌ Don't mix TypeScript and JavaScript imports
❌ Don't skip tests
❌ Don't ignore TypeScript errors
✅ Always run `npm run build` after changes
✅ Use `npm run watch` during development
✅ Write tests first
✅ Use strict mode in tsconfig.json
