# Feilsøkingsguide / Troubleshooting Guide

## 🚫 Problem: "Another pair session is already active"

Dette er **ikke** et autentiseringsproblem. Homey tillater bare én pairing-sesjon om gangen per driver. Feilen oppstår når:

- En tidligere pairing-sesjon ikke ble riktig avsluttet
- Du startet en ny pairing mens en annen fortsatt var aktiv
- Appen krasjet under pairing

### ✅ Løsning:

**Metode 1: Restart appen (Raskest)**
1. I Homey mobil-app, gå til **Innstillinger** → **Apper**
2. Finn "Renault & Dacia" appen
3. Klikk på **Restart app**
4. Prøv å pare på nytt

**Metode 2: Via Homey CLI**
```bash
homey app restart
```

**Metode 3: Full reinstallasjon (hvis restart ikke hjelper)**
```bash
homey app uninstall
homey app install
```

⚠️ **Advarsel**: Metode 3 vil fjerne alle eksisterende enheter. Bruk kun hvis restart ikke fungerer.

---

## ❌ Problem: "Feil brukerinfo" / "Wrong credentials" ved pairing

Hvis du får feilmelding om at brukernavnet eller passordet er feil når du prøver å legge til bilen din, kan det skyldes flere ting.

### 🔍 Steg 1: Sjekk loggene

1. Åpne Homey Developer Tools
2. Gå til **CLI** eller **Web interface**
3. Kjør `homey app log` i terminalen
4. Prøv å pare bilen på nytt
5. Se etter følgende i loggene:

#### Positive tegn (Alt OK):
```
🔧 RenaultApiClient initialized
   Locale: sv-SE (SE)
   Username: din@epost.no
🔐 Login attempt #1
🌐 API Request: POST https://accounts.eu1.gigya.com/accounts.login
✅ API Response: 200 https://accounts.eu1.gigya.com/accounts.login
Gigya login successful
✅ Login successful
```

#### Negative tegn (Problem):
```
❌ Gigya login failed. Status: 403, Reason: Invalid credentials
```
eller
```
❌ API Error 403: { errorCode: 403042, statusReason: 'invalid loginID or password' }
```

### 🔍 Steg 2: Verifiser innloggingsinformasjonen

#### Test med Postman (Anbefalt metode)

Se [postman/QUICKSTART.md](postman/QUICKSTART.md) for å teste API-et direkte:

1. Importer Postman collection fra `postman/` mappen
2. Velg riktig miljø (Norge, Sverige, Danmark, Finland)
3. Sett inn brukernavn og passord
4. Kjør **1.1 Gigya Login**
5. Hvis dette feiler, er problemet med brukerinfo eller API-nøkkel

#### Test på My Renault/Dacia

1. Gå til [my.renault.no](https://my.renault.no) eller [www.mydacia.com](https://www.mydacia.com)
2. Logg inn med samme brukernavn og passord
3. Hvis det ikke fungerer her, må du:
   - Tilbakestille passordet ditt
   - Verifisere at du bruker riktig e-postadresse

### 🔍 Steg 3: Sjekk locale/region

Appen bruker API-nøkler som er **region-spesifikke**. Hvis du har en norsk Renault-konto, må du velge Norge.

**VIKTIG**: Hver region har sin egen Gigya API-nøkkel! Hvis du bruker feil region, vil autentiseringen feile umiddelbart.

**Eksempel på forskjellige API-nøkler:**
- Norge: `3_QrPkEJr69l7rHkdCVls0owC80BB4CGz5xw_b0gBSNdn3pL04wzMBkcwtbeKdl1g9`
- Sverige: `3_EN5Hcnwanu9_Dqot1v1Aky1YelT5QqG4TxveO0EgKFWZYu03WkeB9FKuKKIWUXIS`
- Danmark: `3_5x-2C8b1R4MJPQXkwTPdIqgBpcw653Dakw_ZaEneQRkTBdg9UW9Qg_5G-tMNrTMc`

**Støttede regioner:**
- 🇳🇴 Norge (`nb-NO`) - **Default i v3.0+**
- 🇸🇪 Sverige (`sv-SE`)
- 🇩🇰 Danmark (`da-DK`)
- 🇫🇮 Finland (`fi-FI`)
- 🇬🇧 Storbritannia (`en-GB`)
- 🇩🇪 Tyskland (`de-DE`)
- 🇫🇷 Frankrike (`fr-FR`)

⚠️ **Viktig**: Kontoen din må matche regionen. Hvis du registrerte kontoen i Norge, velg Norge.

**Hvordan sjekke:** I loggene vil du se:
```
🔧 RenaultApiClient initialized
   Locale: nb-NO (NO)
   Gigya API Key: 3_QrPkEJr69l7r...
```

Hvis locale er feil (f.eks. `sv-SE` når du har norsk konto), vil du få feilmelding umiddelbart.

### 🔍 Steg 4: Sjekk for spesialtegn i passordet

Hvis passordet ditt inneholder spesialtegn som `&`, `%`, `#`, `?`, kan det i sjeldne tilfeller skape problemer.

**Midlertidig løsning:**
1. Gå til My Renault/Dacia website
2. Endre passordet til noe uten spesialtegn
3. Prøv å pare bilen igjen
4. Endre passordet tilbake etterpå

### 🔍 Steg 5: Sjekk for kontoblokkering

Hvis du har prøvd å logge inn mange ganger med feil passord (fra app eller annen kilde), kan kontoen din være midlertidig låst.

**Løsning:**
1. Vent 15-30 minutter
2. Eventuelt tilbakestill passordet via "Glemt passord"
3. Prøv igjen

### 🔍 Steg 6: Sjekk API-nøkler (Utviklere)

Hvis du er utvikler og har endret koden, kan API-nøklene være utdaterte.

**KRITISK: API-kallrekkefølge**

Renault/Gigya API krever at kall gjøres i riktig rekkefølge:

✅ **Korrekt rekkefølge** (som i Postman):
1. **Login** → `login_token`
2. **Get Account Info** (med `login_token`) → `personId`
3. **Get JWT** (med `login_token`) → `id_token`
4. **Get Person Details** (med `id_token`) → `accountId`

❌ **Feil rekkefølge** (vil feile):
1. Login → `login_token`
2. **Get JWT** → `id_token` ← For tidlig!
3. Get Account Info → `personId`
4. Get Person Details → `accountId`

Appen følger nå korrekt rekkefølge (v3.0+). Se [src/api/renault-api-client.ts](src/api/renault-api-client.ts) metode `getAccountInfo()`.

**Oppdater API-nøkler:**

API-nøklene ligger i [src/config/renault-config.ts](src/config/renault-config.ts). Disse er hentet fra:

```
https://renault-wrd-prod-1-euw1-myrapp-one.s3-eu-west-1.amazonaws.com/configuration/android/config_<locale>.json
```

Eksempel for Norge:
```
https://renault-wrd-prod-1-euw1-myrapp-one.s3-eu-west-1.amazonaws.com/configuration/android/config_nb_NO.json
```

Sjekk om `gigyaApiKey` har endret seg.

### 🔍 Steg 7: Aktivér detaljert logging

Med v3.0+ har vi lagt til omfattende logging. Loggene vil vise:

- 🔧 Konfigurasjon ved oppstart
- 🔐 Antall innloggingsforsøk
- 🌐 Alle API-kall med parametere (passord maskert)
- ✅/❌ Suksess/feil med detaljer
- 📊 Debug-informasjon (token status, cache, etc.)

**Debug-output eksempel:**
```javascript
{
  locale: 'sv-SE',
  countryCode: 'SE',
  username: 'test@example.com',
  hasAccountId: false,
  hasVin: false,
  hasCachedToken: false,
  hasCachedLoginToken: true,
  loginAttempts: 1,
  tokenExpiryIn: null,
  loginTokenExpiryIn: 2985  // sekunder til token utløper
}
```

### 📧 Rapporter problemer

Hvis ingen av stegene over løser problemet, vennligst opprett en issue på GitHub med:

1. **Fullstendige logger** fra `homey app log` (masker passord!)
2. **Debug-info** fra feilmeldingen
3. **Region/locale** du bruker
4. **Kjøretøymodell** (Zoe, Spring, osv.)
5. **Om det fungerer i Postman** eller på My Renault website

---

## 🚨 Andre vanlige problemer

### Problem: "No MYRENAULT or MYDACIA account found"

**Årsak:** Person-ID finnes, men ingen tilknyttet kjøretøy-konto.

**Løsning:**
1. Verifiser at du har registrert kjøretøyet ditt på My Renault/Dacia
2. Logg inn på websiden og sjekk at bilen vises der
3. Vent noen timer hvis du nettopp har registrert

### Problem: Token expired / Session timeout

**Årsak:** JWT token eller login token har utløpt.

**Løsning:** Appen håndterer dette automatisk. Hvis problemet vedvarer:
1. Fjern enheten fra Homey
2. Legg den til på nytt
3. Sjekk loggene for feil

### Problem: API Error 502 / 503

**Årsak:** Renault API er midlertidig nede eller overbelastet.

**Løsning:**
- Dette er normalt og forekommer av og til
- Appen vil automatisk prøve på nytt
- Vent 5-10 minutter og prøv igjen

---

## 🆘 Hjelp og support

- 📖 [README.md](README.md) - Hoveddokumentasjon
- 🧪 [Postman Guide](postman/QUICKSTART.md) - Test API-et manuelt
- 📊 [Error Analysis](postman/ERROR_ANALYSIS.md) - Forventet API-oppførsel
- 🐛 [GitHub Issues](https://github.com/bypo/se.cohen.renaultze-master/issues) - Rapporter bugs
