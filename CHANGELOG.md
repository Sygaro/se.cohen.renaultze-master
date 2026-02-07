# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **CRITICAL**: Fixed authentication order to match Postman/API specification
  - Root cause: App was calling `getIdToken()` (JWT) BEFORE `getAccountInfo()`
  - Postman flow: Login → Get Account Info → Get JWT → Get Person Details
  - Old app flow: Login → Get JWT → Get Account Info → Get Person Details (WRONG!)
  - New app flow: Login → Get Account Info → Get JWT → Get Person Details (CORRECT!)
  - JWT must be generated AFTER account info is retrieved
- **CRITICAL**: Fixed incorrect default locale for Renault Zoe
  - Changed from 'sv-SE' (Sweden) to 'nb-NO' (Norway)
  - Each country has different Gigya API keys - using wrong key causes authentication to fail immediately
  - Users with Norwegian accounts were failing because Swedish API key was being used
- **Critical**: Fixed double authentication bug that caused "wrong credentials" error during device pairing
  - Root cause: `getAccountInfo()` was calling `gigyaLogin()` twice (once via `getIdToken()` and once directly)
  - This caused session conflicts, rate limiting, and misleading error messages
  - Solution: Implemented login token caching similar to JWT token caching
  - Login tokens are now cached for 50 minutes and reused across API calls

### Added
- Comprehensive logging throughout authentication flow
  - Track number of login attempts with visible counter
  - Log all API requests with masked sensitive data
  - Show configuration on client initialization
- New `getDebugInfo()` method for troubleshooting authentication issues
  - Returns current state of tokens, cache, credentials
  - Useful for debugging pairing problems
- Detailed error messages with specific guidance for common issues
  - Error code 403042: Invalid credentials
  - Error code 403047: Account locked
  - Network errors with connection hints
- **TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
  - Step-by-step debugging instructions
  - Postman testing guide
  - Common problem solutions

### Changed
- Enhanced axios interceptors with better error handling and response logging
- Improved driver error messages with actionable steps for users
- More informative logging with emojis for easier reading (🔧🔐🌐✅❌)
- **Default locale changed from 'sv-SE' (Sweden) to 'nb-NO' (Norway)**
  - ⚠️ **BREAKING**: Users in Sweden, Denmark, Finland, or other countries must update driver code to use their locale
  - Edit `src/drivers/renault-zoe/driver.ts` line 39: change `locale: 'nb-NO'` to your country code
  - Available locales: 'sv-SE', 'da-DK', 'fi-FI', 'en-GB', 'de-DE', 'fr-FR', etc.
  - See [src/config/renault-config.ts](src/config/renault-config.ts) for all supported locales

## [3.0.0] - 2026-02-07

### Added
- Complete TypeScript rewrite with strict type checking
- Jest testing framework with comprehensive test coverage
- Modern API client based on renault-api Python library
- Automatic token management and caching
- Model-specific capability detection
- Fallback mechanisms for API changes
- ESLint for code quality
- Prettier for code formatting
- EditorConfig for consistent coding styles
- GitHub Actions CI/CD pipeline
- Support for Node.js 25+
- TypeScript 7-ready configuration (`nodenext` module resolution)
- Homey SDK 4.x support

### Changed
- Upgraded to Homey SDK 4.0 (from 3.x)
- Updated Node.js requirement to >= 25.0.0 (from >= 16.0.0)
- Migrated from JavaScript to TypeScript
- Improved error handling and retry logic
- Enhanced logging and debugging capabilities

### Fixed
- API token expiration handling
- Fallback for charge mode endpoint changes
- Build process with proper TypeScript configuration

### Security
- Updated all dependencies to latest secure versions
- Addressed dependency vulnerabilities where possible
- Note: 12 low-moderate vulnerabilities remain in Homey SDK dependencies (upstream issue)

## [2.x.x] - Legacy

Previous versions maintained by Jonathan Cohen and Oreste Dimaggio. See git history for details.

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
