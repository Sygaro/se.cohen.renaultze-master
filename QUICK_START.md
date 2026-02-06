# 🚀 Quick Start Guide

## 1. Install Dependencies (2 minutes)

```bash
# Replace old package.json with new one
mv package.json.new package.json

# Install all dependencies
npm install
```

## 2. Build TypeScript (1 minute)

```bash
npm run build
```

This compiles all `src/**/*.ts` files to `dist/` directory.

## 3. Run Tests (1 minute)

```bash
npm test
```

All tests should pass! ✅

## 4. Test in Homey CLI (Optional)

```bash
# Install Homey CLI if not already installed
npm install -g homey

# Run in development mode
homey app run
```

## 📁 File Locations After Build

After running `npm run build`, you'll have:

```
dist/
├── api/
│   └── renault-api-client.js      # Compiled API client
├── config/
│   └── renault-config.js           # Compiled config
├── drivers/
│   └── renault-zoe/
│       └── device.js               # Compiled driver
└── types/
    └── renault-api.types.js        # Runtime types (minimal)
```

## 🔧 Development Workflow

### Option A: Manual Build
```bash
# Make changes to .ts files
# Build
npm run build
# Test
npm test
```

### Option B: Watch Mode (Recommended)
```bash
# Terminal 1: Auto-rebuild on changes
npm run watch

# Terminal 2: Auto-run tests on changes
npm run test:watch

# Terminal 3: Run in Homey
homey app run
```

## 📝 What to Do Next?

### For Testing:

1. **Update app.json** - Point to compiled files:
```json
{
  "drivers": [
    {
      "id": "renault-zoe",
      "class": "socket",  
      "$extends": ["defaults"],
      "$files": {
        "device.js": "dist/drivers/renault-zoe/device.js"
      }
    }
  ]
}
```

2. **Create app.ts**:
```typescript
import Homey from 'homey';

class RenaultApp extends Homey.App {
  async onInit() {
    this.log('Renault Zoe app is running!');
  }
}

module.exports = RenaultApp;
```

3. **Build and test**:
```bash
npm run build
homey app run
```

### For Production:

1. Copy compiled files to driver directories:
```bash
cp dist/drivers/renault-zoe/device.js drivers/renault-zoe/
```

2. Update app.json version to 3.0.0

3. Test with real vehicle

4. Publish to Homey App Store

## 🐛 Common Issues

### "Cannot find module '@types/node'"
```bash
npm install --save-dev @types/node
```

### "Module not found: 'homey'"
```bash
npm install homey@3.0.0
```

### Build errors
```bash
# Clean build
rm -rf dist/
npm run build
```

### Test failures
```bash
# Clear cache
npm test -- --clearCache
npm test
```

## 📊 Verify Everything Works

```bash
# 1. Type checking (should have no errors)
npx tsc --noEmit

# 2. Linting (should pass)
npm run lint

# 3. Tests (should all pass)
npm test

# 4. Build (should complete successfully)
npm run build

# 5. Check that dist/ has files
ls -R dist/
```

If all these pass, you're ready to go! 🎉

## 💡 Tips

- **Use watch mode** during development for instant feedback
- **Run tests first** before building to catch errors early
- **Check types** with `npx tsc --noEmit` for quick validation
- **Use VS Code** for best TypeScript experience (auto-complete, errors, etc.)

---

Need more details? See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) or [README_TYPESCRIPT.md](README_TYPESCRIPT.md)
