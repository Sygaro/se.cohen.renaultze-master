# Test Results Template

Use this template to document which endpoints work for your specific vehicle model.

## Vehicle Information

- **Brand**: Renault / Dacia
- **Model**: _________________________
- **Model Code**: ____________________ (e.g., X102VE for Zoe Phase 2)
- **Year**: _________________________
- **Country**: ______________________
- **Current Battery**: ______________% (important for HVAC tests)

---

## Test Results

### ✅ Authentication (Should all work)

| Test | Status | Notes |
|------|--------|-------|
| 1.1 Gigya Login | ⬜ Pass ⬜ Fail | |
| 1.2 Get Account Info | ⬜ Pass ⬜ Fail | |
| 1.3 Get JWT Token | ⬜ Pass ⬜ Fail | |
| 2.1 Get Person Details | ⬜ Pass ⬜ Fail | |
| 2.2 Get Vehicles | ⬜ Pass ⬜ Fail | VIN saved? |

---

### 📊 Vehicle Data (Read-only)

| Test | Status | Error Code | Notes |
|------|--------|------------|-------|
| 3.1 Get Battery Status | ⬜ Pass ⬜ Fail | | Should always work |
| 3.2 Get Charge Mode | ⬜ Pass ⬜ Fail | | May fail for newer models (400002) |
| 3.3 Get Charging Settings | ⬜ Pass ⬜ Fail | | May fail for older models (502000) |
| 3.4 Get HVAC Status | ⬜ Pass ⬜ Fail | | May not be supported |
| 3.5 Get Location | ⬜ Pass ⬜ Fail | | Not supported by Zoe Phase 1 |
| 3.6 Get Cockpit | ⬜ Pass ⬜ Fail | | Not supported by Zoe Phase 1 |

---

### 🎛️ Vehicle Control (Actions)

| Test | Status | Error Code | Notes |
|------|--------|------------|-------|
| 4.1 Set Charge Mode - Always | ⬜ Pass ⬜ Fail | | |
| 4.2 Set Charge Mode - Scheduled | ⬜ Pass ⬜ Fail | | |
| 4.3 Start HVAC | ⬜ Pass ⬜ Fail | | Requires battery > 20% |
| 4.4 Cancel HVAC | ⬜ Pass ⬜ Fail | | Requires battery > 20% |
| 4.5 Pause Charging | ⬜ Pass ⬜ Fail | | New KCM endpoint |
| 4.6 Resume Charging | ⬜ Pass ⬜ Fail | | New KCM endpoint |

---

## 📝 Summary

### Working Endpoints:
(List the endpoints that worked for your vehicle)

1. 
2. 
3. 

### Failed Endpoints:
(List the endpoints that failed with error codes)

1. 
2. 
3. 

### Expected Failures:
(Mark which failures are expected based on ERROR_ANALYSIS.md)

- ⬜ Charge Mode (400002) - Expected for newer models
- ⬜ Charging Settings (502000) - Expected for older models  
- ⬜ HVAC (400004) - Expected if battery < 20%

### Charge Mode Strategy:
Which endpoint works for your car?

- ⬜ 3.2 Charge Mode (older API)
- ⬜ 3.3 Charging Settings (newer API)
- ⬜ Neither (not supported for this model)

---

## 🚗 Vehicle Capability Summary

Based on your tests, your vehicle supports:

- ⬜ Battery Status
- ⬜ Charge Mode Control
- ⬜ HVAC Control
- ⬜ Location Tracking
- ⬜ Mileage (Cockpit)
- ⬜ Pause/Resume Charging

---

## 📤 Share Your Results

Consider sharing your test results with the community!

You can:
1. Create a GitHub issue with this filled template
2. Help improve the model capability matrix
3. Assist other users with the same vehicle model

---

## ℹ️ Additional Notes

Add any observations or special behaviors you noticed:

```
(Your notes here)
```
