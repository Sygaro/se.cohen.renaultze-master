# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
