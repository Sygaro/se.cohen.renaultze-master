# Postman Collection - Quick Start (English)

> 📘 **Seeing errors?** Read [ERROR_ANALYSIS.md](ERROR_ANALYSIS.md) for detailed explanation of expected errors!

## Quick Setup

1. **Import to Postman**
   - Open Postman
   - Click **Import**
   - Drag & drop all JSON files
   
2. **Select Environment**
   - Choose your country environment (e.g., "Renault API - Norway")
   
3. **Configure Credentials**
   - Click on the environment
   - Set `username` = your_email@example.com
   - Set `password` = your_password

## Usage Flow

### First Time Setup (run in order):

1. **1.1 Gigya Login** → Gets login token
2. **1.2 Get Account Info** → Gets person ID
3. **1.3 Get JWT Token** → Gets JWT (valid 15 min)
4. **2.1 Get Person Details** → Gets account ID
5. **2.2 Get Vehicles** → Gets VIN

All tokens are saved automatically! 🎉

### Test Vehicle Data:

- **3.1** Battery Status (level, range, charging)
- **3.2** Charge Mode (always/scheduled)
- **3.3** Charging Settings (with schedules)
- **3.4** HVAC Status (climate control)
- **3.5** Location (GPS)
- **3.6** Cockpit (mileage)

### Control Vehicle:

- **4.1-4.2** Set Charge Mode
- **4.3-4.4** Start/Cancel HVAC
- **4.5-4.6** Pause/Resume Charging

## Available Countries

- 🇸🇪 Sweden
- 🇳🇴 Norway
- 🇩🇰 Denmark
- 🇫🇮 Finland
- 🇬🇧 United Kingdom
- 🇩🇪 Germany
- 🇫🇷 France

*More available in source code (NL, IT, ES)*

## Troubleshooting

**401 Error?** → JWT expired, run "1.3 Get JWT Token" again

**400 FUNCTIONAL on Charge Mode?** → Normal! Endpoint deprecated for newer models. Try "3.3 Charging Settings" instead. App handles this automatically.

**502000 on Charging Settings?** → Normal! Endpoint not available for older models. Try "3.2 Charge Mode" instead. App handles this automatically.

**"Insufficient Battery Level" on HVAC?** → Normal! Battery below 20%. This is a Renault safety feature, not an error.

**Empty response?** → Car might be offline or in deep garage

## Expected Behavior

Not all endpoints work for all models:
- **3.2 Charge Mode**: Works for older Zoe models ✅
- **3.3 Charging Settings**: Works for newer models (Megane E-Tech) ✅
- **One of these should work** - the app tries both automatically 🔄

## Security

- Never commit files with real credentials!
- JWT tokens expire after 15 minutes
- Password field marked as "secret" in Postman

---

🇳🇴 For norsk dokumentasjon, se [README.md](README.md)
