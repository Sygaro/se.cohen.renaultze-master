# Renault & Dacia Homey App v3.0

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D25.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Homey SDK](https://img.shields.io/badge/Homey%20SDK-4.0-orange)](https://apps.developer.homey.app/)
[![License](https://img.shields.io/badge/license-LGPL--3.0-blue.svg)](LICENSE)

Modern, type-safe Homey app for Renault and Dacia electric vehicles built with TypeScript.

## 🎯 Features

- ✅ **Full TypeScript** support with strict type checking
- ✅ **Homey SDK 4.x** - Latest platform support
- ✅ **Node.js 25+** - Modern JavaScript runtime
- ✅ **TypeScript 7-ready** - Future-proof module configuration
- ✅ **Comprehensive test coverage** with Jest
- ✅ **Modern API client** based on renault-api Python library
- ✅ **Automatic token management** and caching
- ✅ **Model-specific capabilities** detection
- ✅ **Fallback mechanisms** for API changes
- ✅ **ESLint + Prettier** for code quality

## 📦 Supported Vehicles

- Renault Zoe Phase 1 (X101VE)
- Renault Zoe Phase 2 (X102VE)
- Renault Megane E-Tech (XCB1VE)
- Dacia Spring (XBG1VE)
- Renault Kangoo EV (XJA1VP)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 25.0.0 (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- Homey CLI: `npm install -g homey`

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Deploy to Homey
homey app run
```

## 🏗️ Project Structure

```
src/
├── api/                    # API client implementation
│   ├── renault-api-client.ts
│   └── __tests__/
├── config/                 # Configuration files
│   └── renault-config.ts
├── drivers/               # Homey device drivers
│   ├── renault-zoe/
│   └── dacia-spring/
└── types/                 # TypeScript type definitions
    └── renault-api.types.ts
```

## 📝 Available Scripts

```bash
npm run build           # Compile TypeScript
npm run watch           # Auto-rebuild on changes
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Type check without building
npm run clean           # Clean build artifacts
npm run validate        # Validate Homey app
npm run ci              # Run all checks (CI pipeline)
```

## 🧪 Testing

Tests are written using Jest with 50%+ coverage threshold:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- renault-api-client.test.ts

# Coverage report
npm run test:coverage
```

## 🛠️ Development Tools

- **TypeScript 5.9** - Type safety with `nodenext` module resolution
- **ESLint 9** - Code quality and consistency
- **Prettier 3** - Automatic code formatting
- **Jest 29** - Comprehensive testing framework
- **EditorConfig** - Consistent coding styles across editors

## 🔧 Configuration

Vehicle capabilities are automatically detected based on model code. The app supports multiple locales including:
- Sweden (sv-SE)
- Norway (nb-NO, no-NO)
- Denmark (da-DK)
- Finland (fi-FI)
- UK (en-GB)
- Germany (de-DE)
- France (fr-FR)
- Netherlands (nl-NL)
- Italy (it-IT)
- Spain (es-ES)

## 📖 Usage

1. Install the app on your Homey
2. Add a new device and select Renault/Dacia
3. Login with your My Renault credentials
4. Select your vehicle from the list (identified by VIN)
5. The app will sync battery status, location, charging state, etc.

Note: This app uses the unofficial Renault API which may change without notice. Updates will be made as quickly as possible if changes occur.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

For detailed file structure and development guidelines, see [FILE_GUIDE.md](FILE_GUIDE.md).

## 📄 License

LGPL-3.0-only

## 👥 Authors & Contributors

- **Jonathan Cohen** - Original app (<jonathan@cohen.se>)
- **Oreste Dimaggio** - Contributions (<oreste@dimaggio.it>)
- **Reidar Gran** - v3.0 TypeScript rewrite

## 🙏 Acknowledgments

Special thanks to:
- [hacf-fr/renault-api](https://github.com/hacf-fr/renault-api) - Python library inspiration
- [jamesremuscat/pyze](https://github.com/jamesremuscat/pyze) - Original API research
- Homey community for support and testing

## 📚 Documentation

- [Renault API Documentation](https://renault-api.readthedocs.io/)
- [Homey Apps SDK3](https://apps-sdk-v3.developer.homey.app/)
- [FILE_GUIDE.md](FILE_GUIDE.md) - Detailed file structure guide