# Renault & Dacia Homey App v3.0 (TypeScript)

Modern, type-safe Homey app for Renault and Dacia electric vehicles built with TypeScript.

## 🎯 Features

- ✅ **Full TypeScript** support with strict type checking
- ✅ **Comprehensive test coverage** with Jest
- ✅ **Modern API client** based on renault-api Python library
- ✅ **Automatic token management** and caching
- ✅ **Model-specific capabilities** detection
- ✅ **Fallback mechanisms** for API changes
- ✅ **ESLint** for code quality

## 📦 Supported Vehicles

- Renault Zoe Phase 1 (X101VE)
- Renault Zoe Phase 2 (X102VE)
- Renault Megane E-Tech (XCB1VE)
- Dacia Spring (XBG1VE)
- Renault Kangoo EV (XJA1VP)

## 🏗️ Project Structure

```
src/
├── api/                    # API client implementation
│   ├── renault-api-client.ts
│   └── __tests__/
├── config/                 # Configuration files
│   └── renault-config.ts
├── drivers/               # Homey device drivers
│   └── renault-zoe/
├── types/                 # TypeScript type definitions
│   └── renault-api.types.ts
└── utils/                 # Utility functions
```

## 🚀 Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Homey CLI (`npm install -g homey`)

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check code coverage
npm run test:coverage

# Lint code
npm run lint
npm run lint:fix
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build

# Watch mode for development
npm run watch
```

## 🧪 Testing

Tests are written using Jest and follow best practices:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- renault-api-client.test.ts

# Coverage report
npm run test:coverage
```

## 📖 API Client Usage

### Basic Example

```typescript
import { RenaultApiClient } from './api/renault-api-client';

// Create client
const client = new RenaultApiClient(
  {
    username: 'your@email.com',
    password: 'password',
  },
  'sv-SE' // locale
);

// Get account info
const account = await client.getAccountInfo();

// Get vehicles
const vehicles = await client.getVehicles();

// Set active vehicle
client.setVehicle(vehicles[0].vin, vehicles[0].modelCode);

// Get battery status
const battery = await client.getBatteryStatus();
if (battery.status === 'ok') {
  console.log(`Battery: ${battery.data.data.attributes.batteryLevel}%`);
}

// Start HVAC
await client.startHvac(21);

// Set charge mode
await client.setChargeMode('always_charging');
```

### Supported Locales

- `sv-SE` - Sweden
- `nb-NO` - Norway
- `da-DK` - Denmark
- `fi-FI` - Finland
- `en-GB` - United Kingdom
- `de-DE` - Germany
- `fr-FR` - France
- `nl-NL` - Netherlands
- `it-IT` - Italy
- `es-ES` - Spain

## 🔧 Configuration

Vehicle capabilities are automatically detected based on model code:

```typescript
import { getCapabilitiesForModel } from './config/renault-config';

const capabilities = getCapabilitiesForModel('X102VE');
console.log(capabilities);
// {
//   supportsBatteryStatus: true,
//   supportsCockpit: true,
//   supportsHvacStatus: false,
//   supportsChargeMode: true,
//   supportsLocation: true,
//   supportsFuelStatus: false,
//   reportsChargingPowerInWatts: false
// }
```

## 📝 Type Safety

All API responses are fully typed:

```typescript
const batteryResult = await client.getBatteryStatus();

if (batteryResult.status === 'ok') {
  // TypeScript knows batteryResult.data is BatteryStatusResponse
  const level = batteryResult.data.data.attributes.batteryLevel;
  const autonomy = batteryResult.data.data.attributes.batteryAutonomy;
}
```

## 🔄 API Response Format

All methods return a standardized response:

```typescript
interface ApiResponse<T> {
  status: 'ok' | 'error' | 'notSupported';
  data: T | null;
  error?: string;
}
```

## 🏃 Running in Homey

```bash
# Validate app
npm run validate

# Run on Homey (requires homey CLI)
homey app run
```

## 📚 Documentation

- [Renault API Documentation](https://renault-api.readthedocs.io/)
- [renault-api Python library](https://github.com/hacf-fr/renault-api)
- [Homey Apps SDK3](https://apps-sdk-v3.developer.homey.app/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

LGPL-3.0-only

## 👥 Authors

- Jonathan Cohen (original app)
- Oreste Dimaggio (contributions)
- Reidar Gran (v3.0 TypeScript rewrite)

## 🙏 Acknowledgments

- [hacf-fr/renault-api](https://github.com/hacf-fr/renault-api) - Python library inspiration
- [jamesremuscat/pyze](https://github.com/jamesremuscat/pyze) - Original API research
- Homey community for support and testing
