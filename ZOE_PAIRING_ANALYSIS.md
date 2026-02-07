# Renault Zoe Pairing Problem - Analyse

**Dato:** 7. februar 2026  
**Status:** 🔍 UNDER INVESTIGATE

## 📋 Situasjon

- ✅ Dacia Spring driver hadde feil modelCode (fikset)
- ✅ Postman-autentisering fungerer perfekt
- ❌ Zoe-pairing fungerer fortsatt ikke
- ✅ Brukernavn/passord er verifisert korrekt

## 🔍 Analyse av Zoe Driver

### ✅ Kode ser korrekt ut

**Renault Zoe driver.ts** bruker riktig implementering:

```typescript
// ✅ KORREKT i src/drivers/renault-zoe/driver.ts (linje 122)
modelCode: vehicle.modelCode,  // Bruker modelCode, IKKE model
```

**API-flyt** følger Postman-sekvensen:
1. ✅ Login med Gigya
2. ✅ Get Account Info → pers onId
3. ✅ Get JWT Token
4. ✅ Get Person Details → accountId
5. ✅ Get Vehicles → liste

### 🚨 MULIGE PROBLEMOMRÅDER

## 1. Async Error Handling i Homey setHandler

**Problem:** Homey's `setHandler` med async funksjoner kan ikke automatisk konvertere kastet Error til callback-format.

**Hvordan det fungerer nå:**

```typescript
// Backend (driver.ts)
session.setHandler('login_with_locale', async (data) => {
  try {
    // ... autentisering
    return true;  // Success
  } catch (error: unknown) {
    throw new Error(errorMessage);  // ← Kastes, men...
  }
});
```

```javascript
// Frontend (login_with_locale.html)
Homey.emit('login_with_locale', { ... }, (err, result) => {
  if (err) {  // ← Er "err" satt når backend kaster error?
    reject(new Error(err));
  } else {
    resolve(result);
  }
});
```

**Problemet:** Når en async handler kaster en error, er det ikke sikkert at Homey automatisk:
- Fanger Promise rejection
- Konverterer til callback-format `(err, null)`
- Sender error-meldingen til frontend

**Mulig løsning:** Eksplisitt callback-håndtering:

```typescript
session.setHandler('login_with_locale', async (data, callback) => {
  try {
    // ... autentisering
    return callback(null, true);  // Eksplisitt success-callback
  } catch (error: unknown) {
    return callback(error.message, null);  // Eksplisitt error-callback
  }
});
```

ELLER bruke Homey's error-system:

```typescript
session.setHandler('login_with_locale', async (data) => {
  try {
    // ... autentisering
    return true;
  } catch (error: unknown) {
    // Istedenfor throw, bruk Homey's error-objekt
    return Promise.reject(new Error(errorMessage));
  }
});
```

## 2. Timing/Timeout Problems

**Potensielt problem:** API-kallene kan ta lengre tid enn forventet.

**Autentiseringsflyt:**
```
1. gigyaLogin() → login_token (1-3 sek)
2. gigyaAccountInfo() → personId (1-2 sek)
3. gigyaGetJWT() → id_token (1-2 sek)
4. kamereonPersonDetails() → accountId (2-4 sek)
   TOTAL: 5-11 sekunder
```

**Test:** Legg til timeout-logging:

```typescript
session.setHandler('login_with_locale', async (data) => {
  const startTime = Date.now();
  
  try {
    this.log(`[${Date.now() - startTime}ms] Starting login...`);
    
    apiClient = new RenaultApiClient(/* ... */);
    this.log(`[${Date.now() - startTime}ms] API client created`);
    
    const accountInfo = await apiClient.getAccountInfo();
    this.log(`[${Date.now() - startTime}ms] Got account info`);
    
    settings.accountId = accountInfo.accountId;
    this.log(`[${Date.now() - startTime}ms] Login complete!`);
    
    return true;
  } catch (error: unknown) {
    this.error(`[${Date.now() - startTime}ms] Login failed:`, error);
    throw error;
  }
});
```

## 3. Homey.emit vs Homey.setHandler Mismatch

**Mulig problem:** Homey's emit/setHandler kan ha forskjellig oppførsel enn forventet.

**Alternativ metode - bruk Promise-basert API:**

```javascript
// Frontend - istedenfor callback-basert Homey.emit
try {
  const result = await Homey.api('POST', '/login_with_locale', {
    locale: locale,
    username: username,
    password: password
  });
  
  console.log('Login successful:', result);
  await Homey.showView('list_devices');
} catch (error) {
  console.error('Login failed:', error);
  setLoading(false);
  showError(error.message);
}
```

```typescript
// Backend - eksporter API endpoint istedenfor setHandler
this.homey.api.post('/login_with_locale', async (args) => {
  try {
    // ... autentisering
    return { success: true, accountId: settings.accountId };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
});
```

## 4. Hidden Errors i API Client

**Mulig problem:** Errors kan kastes fra API-klienten som ikke håndteres riktig.

**Sjekk disse stedene:**

1. **getAccountInfo()** - Line 292:
   ```typescript
   if (!account) {
     throw new Error('No MYRENAULT or MYDACIA account found');
   }
   ```
   → Hva hvis API returnerer tom accounts-liste?

2. **getVehicles()** - Line 368:
   ```typescript
   return response.data.vehicleLinks.map(/* ... */);
   ```
   → Hva hvis `vehicleLinks` er undefined eller tom?

3. **Token refresh** - Under getIdToken():
   → Hva hvis token-refresh feiler midt i prosessen?

**Test:** Legg til try-catch rundt hver API-kall:

```typescript
try {
  const accountInfo = await apiClient.getAccountInfo();
  this.log('✅ Account info retrieved:', JSON.stringify(accountInfo));
} catch (error) {
  this.error('❌ getAccountInfo failed:', error);
  throw new Error(`Failed to get account info: ${error.message}`);
}
```

## 5. Locale/Country Mismatch

**Selvom bruker velger riktig land, kan det være andre problemer:**

**Test:** Hardkode locale for testing:

```typescript
const TEST_LOCALE = 'nb-NO';  // eller 'sv-SE', 'da-DK', etc.

session.setHandler('login_with_locale', async (data) => {
  this.log(`User selected locale: ${data.locale}`);
  this.log(`Using test locale: ${TEST_LOCALE}`);
  
  apiClient = new RenaultApiClient(
    { username: data.username, password: data.password },
    TEST_LOCALE  // Hardkode istedenfor data.locale
  );
  
  // ... rest of code
});
```

## 📝 Debugging Plan

### Steg 1: Legg til omfattende logging

```typescript
session.setHandler('login_with_locale', async (data) => {
  this.log('================================================');
  this.log('LOGIN_WITH_LOCALE HANDLER CALLED');
  this.log(`Locale: ${data.locale}`);
  this.log(`Username: ${data.username}`);
  this.log(`Password length: ${data.password.length}`);
  this.log('================================================');

  try {
    this.log('Step 1: Creating API client...');
    apiClient = new RenaultApiClient(/* ... */);
    this.log('✅ API client created');
    this.log('Config:', apiClient.getDebugInfo());

    this.log('Step 2: Calling getAccountInfo()...');
    const accountInfo = await apiClient.getAccountInfo();
    this.log(`✅ Account info retrieved: ${JSON.stringify(accountInfo)}`);

    settings.accountId = accountInfo.accountId;
    this.log('✅ Login successful!');
    this.log('================================================');
    
    return true;
  } catch (error: unknown) {
    this.error('================================================');
    this.error('❌ LOGIN FAILED');
    this.error(`Error type: ${error constructor.name}`);
    this.error(`Error message: ${error instanceof Error ? error.message : String(error)}`);
    
    if (error instanceof Error && error.stack) {
      this.error(`Stack trace: ${error.stack}`);
    }
    
    if (apiClient) {
      this.error('API Client Debug Info:', apiClient.getDebugInfo());
    }
    this.error('================================================');
    
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
});
```

### Steg 2: Test med Homey CLI

```bash
# Kjør appen med logging
homey app run

# I et annet terminal-vindu, følg loggene
homey app log
```

### Steg 3: Test med Postman-verdier

Kopier **EKSAKT samme verdier** fra Postman:
- Username
- Password
- Locale

Og test i appen.

### Steg 4: Sammenlign requests

I Postman og i appen, sammenlign:
- Gigya API key
- URLs
- Headers
- Request bodies

## 🎯 Mest Sannsynlige Årsaker (Rangert)

1. **🔴 MEST SANNSYNLIG:** Async error handling i `setHandler` fungerer ikke som forventet
   - Errors kastes men når ikke frem til frontend
   - Frontend "henger" uten feilmelding

2. **🟡 MULIG:** Timing/timeout problem
   - Requests tar for lang tid  
   - Frontend gir opp før backend er ferdig

3. **🟡 MULIG:** Hidden error i API-klient
   - getAccountInfo() feiler men error-melding er ugjennomsiktig
   - getVehicles() feiler på et senere tidspunkt

4. **🟢 MINDRE SANNSYNLIG:** Locale/config problem
   - API-nøkkel mismatch (men Postman fungerer)
   - URL-problemer (men Postman fungerer)

## 🔧 Anbefalt Fix (Quick Win)

**Prøv denne endringen først:**

```typescript
// I drivers/renault-zoe/driver.ts og drivers/dacia-spring/driver.ts

session.setHandler('login_with_locale', async (data) => {
  this.log('login_with_locale called');
  
  // Valider input
  if (!data.locale || !data.username || !data.password) {
    const error = 'Missing required fields';
    this.error(error);
    throw new Error(error);  // Frontend bør fange denne
  }

  try {
    // Save settings
    settings.locale = data.locale;
    settings.username = data.username;
    settings.password = data.password;

    // Create API client
    this.log(`Creating API client with locale: ${settings.locale}`);
    apiClient = new RenaultApiClient(
      { username: data.username, password: data.password },
      data.locale
    );

    // Add detailed logging
    this.log('API client debug info:', apiClient.getDebugInfo());

    // Authenticate
    this.log('Calling getAccountInfo()...');
    const accountInfo = await apiClient.getAccountInfo();
    this.log(`Account info received: ${JSON.stringify(accountInfo)}`);

    settings.accountId = accountInfo.accountId;

    // Final check
    if (!settings.accountId) {
      throw new Error('Account ID not set after getAccountInfo()');
    }

    this.log('✅ Login successful');
    return true;  // Explicit success return

  } catch (error: unknown) {
    // Enhanced error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    
    this.error('❌ Login failed with error:', errorMessage);
    
    if (apiClient) {
      this.error('API client state:', apiClient.getDebugInfo());
    }
    
    // Ensure error is propagated properly
    if (error instanceof Error) {
      throw error;  // Re-throw original error
    } else {
      throw new Error(errorMessage);  // Wrap in Error object
    }
  }
});
```

## 📊 Test Checklist

- [ ] Homey app restart
- [ ] Kjør `homey app log` i terminal før pairing
- [ ] Prøv pairing med Zoe
- [ ] Noter alle logg-meldinger (spesielt errors)
- [ ] Sjekk om det kommer error-melding i UI
- [ ] Noter hvor lang tid det tar før pairing "gir opp"
- [ ] Prøv med hardkodet locale (nb-NO)
- [ ] Test med samme credentials som fungerer i Postman

## 🆘 Hvis Ingenting Fungerer

**Last resort - bruk Homey's Web API i stedet:**

Se [Homey SDK Documentation](https://apps.developer.homey.app/) for Web API implementering istedenfor pairing handlers.

---

**Neste oppdatering:** Basert på logging output og testresultater
