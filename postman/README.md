# Renault API Postman Collection

Dette er en komplett Postman-samling for å teste alle Renault/Dacia API-endepunkter som brukes av Homey-appen.

> 📘 **Opplever feil i Postman?** Les [ERROR_ANALYSIS.md](ERROR_ANALYSIS.md) for detaljert forklaring av forventede feil!

## 📦 Filer

- **`Renault_API_Collection.postman_collection.json`** - Hovedsamlingen med alle API-forespørsler
- **`Renault_API_Sweden.postman_environment.json`** - Miljø for Sverige
- **`Renault_API_Norway.postman_environment.json`** - Miljø for Norge
- **`Renault_API_Denmark.postman_environment.json`** - Miljø for Danmark
- **`Renault_API_Finland.postman_environment.json`** - Miljø for Finland

## 🚀 Komme i gang

### 1. Importer filer til Postman

1. Åpne Postman
2. Klikk på **Import** knappen
3. Dra og slipp alle JSON-filene eller velg dem manuelt
4. Collection og environments vil bli importert

### 2. Velg riktig miljø

1. I Postman, klikk på miljø-dropdown'en (øverst til høyre)
2. Velg miljøet som passer ditt land (f.eks. "Renault API - Norway")

### 3. Konfigurer påloggingsinformasjon

1. I Postman, klikk på miljøet du valgte
2. Endre følgende verdier:
   - **`username`** - Din Renault/Dacia e-postadresse
   - **`password`** - Ditt Renault/Dacia passord

⚠️ **Viktig**: Disse verdiene lagres i Postman. Ikke del miljøfilen hvis den inneholder ekte påloggingsinformasjon!

## 📋 Hvordan bruke samlingen

### Autentiseringsflyt (Må kjøres først!)

Kjør disse forespørslene i rekkefølge:

1. **1.1 Gigya Login** - Logger inn og får login token
2. **1.2 Get Account Info** - Henter person ID
3. **1.3 Get JWT Token** - Henter JWT token (gyldig i 15 minutter)

Etter dette vil alle nødvendige tokens være lagret automatisk i miljøvariablene.

### Hent kjøretøyinformasjon

4. **2.1 Get Person Details** - Henter account ID
5. **2.2 Get Vehicles** - Henter liste over kjøretøy og setter VIN

### Test kjøretøydata

Nå kan du teste alle data-endepunktene:

- **3.1 Get Battery Status** - Batterinivå, ladesstatus, rekkevidde
- **3.2 Get Charge Mode** - Lademodus (alltid/planlagt)
- **3.3 Get Charging Settings** - Ladeinnstillinger med tidsskjema
- **3.4 Get HVAC Status** - Klimaanlegg status
- **3.5 Get Location** - GPS-posisjon
- **3.6 Get Cockpit** - Kilometerstand

### Test kontrollkommandoer

- **4.1 Set Charge Mode - Always** - Sett til alltid lade
- **4.2 Set Charge Mode - Scheduled** - Sett til planlagt lading
- **4.3 Start HVAC** - Start klimaanlegg (21°C)
- **4.4 Cancel HVAC** - Stopp klimaanlegg
- **4.5 Pause Charging** - Pause lading
- **4.6 Resume Charging** - Gjenoppta lading

## 🔄 Automatisk token-håndtering

Samlingen bruker Post-response scripts som automatisk:

- ✅ Lagrer login_token etter innlogging
- ✅ Lagrer personId fra account info
- ✅ Lagrer id_token (JWT) for API-kall
- ✅ Lagrer accountId fra person details
- ✅ Lagrer VIN fra første kjøretøy

Du trenger ikke å kopiere/lime inn verdier manuelt!

## 🌍 Andre land

Hvis ditt land ikke er inkludert, kan du lage et nytt miljø:

1. Dupliser et eksisterende miljø
2. Oppdater disse verdiene basert på [renault-config.ts](../src/config/renault-config.ts):
   - `locale` - f.eks. "de-DE", "fr-FR", "en-GB"
   - `countryCode` - Landskode (f.eks. "DE", "FR", "GB")
   - `gigyaApiKey` - Spesifikk API-nøkkel for landet

Tilgjengelige land i app-koden:
- 🇸🇪 Sverige (sv-SE)
- 🇳🇴 Norge (nb-NO)
- 🇩🇰 Danmark (da-DK)
- 🇫🇮 Finland (fi-FI)
- 🇬🇧 Storbritannia (en-GB)
- 🇩🇪 Tyskland (de-DE)
- 🇫🇷 Frankrike (fr-FR)
- 🇳🇱 Nederland (nl-NL)
- 🇮🇹 Italia (it-IT)
- 🇪🇸 Spania (es-ES)

## 🔐 Sikkerhet

- **IKKE** commit eller del miljøfiler med ekte påloggingsinformasjon
- JWT tokens utløper etter 15 minutter - kjør "Get JWT Token" på nytt ved behov
- Password-feltet er markert som "secret" i Postman for ekstra sikkerhet

## ⚠️ Viktige notater

### Token-utløp
JWT-token utløper etter 15 minutter. Hvis du får 401/403 feil, kjør:
1. **1.3 Get JWT Token** på nytt

### Modellspesifikk støtte
Ikke alle funksjoner støttes av alle bilmodeller:

| Funksjon | Zoe Phase 1 | Zoe Phase 2 | Megane E-Tech | Dacia Spring | Endepunkt |
|----------|-------------|-------------|---------------|--------------|-----------|
| Battery Status | ✅ | ✅ | ✅ | ✅ | 3.1 |
| Charge Mode (gammel) | ✅ | ✅ | ⚠️ | ❌ | 3.2 |
| Charging Settings (ny) | ❌ | ⚠️ | ✅ | ⚠️ | 3.3 |
| HVAC Status | ⚠️ | ❌ | ✅ | ✅ | 3.4 |
| Location | ❌ | ✅ | ✅ | ✅ | 3.5 |
| Cockpit | ❌ | ✅ | ✅ | ✅ | 3.6 |
| Set Charge Mode | ✅ | ✅ | ✅ | ❌ | 4.1-4.2 |
| HVAC Control | ⚠️ | ❌ | ✅ | ✅ | 4.3-4.4 |
| Pause/Resume Charge | 🔄 | 🔄 | 🔄 | 🔄 | 4.5-4.6 |

**Legende:**
- ✅ = Fullt støttet og fungerer
- ⚠️ = Delvis støtte / Kan returnere feil men fungerer noen ganger
- ❌ = Ikke støttet (returnerer 403 eller 400)
- 🔄 = Nytt KCM endepunkt, variabel støtte

**Viktig om Charge Mode:**
- **Zoe Phase 1 & 2**: Bruk `3.2 Get Charge Mode` (gammel API)
- **Megane E-Tech & nyere**: Bruk `3.3 Get Charging Settings` (ny API)
- **Dacia Spring**: Ingen av endepunktene støttes
- **I appen**: Automatisk fallback - prøver 3.3 først, deretter 3.2

**Viktig om HVAC:**
- Krever batterinivå > 20% (ellers 400004 error)
- Zoe Phase 1: Rapporterer alltid 'off' selv når aktiv
- Zoe Phase 2: Returnerer 403 Forbidden

### Feilkoder og forventede feil

#### ✅ Normal oppførsel (ikke egentlige feil):

**3.2 Get Charge Mode - "Endpoint unavailable for this gateway" (400002)**
- 🔍 **Årsak**: Dette endepunktet er utfaset/deprecated for mange nyere bilmodeller
- 🛠️ **Løsning i appen**: Appen prøver automatisk `3.3 Get Charging Settings` først, og faller tilbake til `charge-mode` hvis det feiler
- ℹ️ **I Postman**: Dette er forventet - prøv `3.3 Get Charging Settings` istedenfor
- 📝 **Støtte**: Eldre Zoe-modeller bruker `charge-mode`, nyere modeller bruker `charging-settings`

**3.3 Get Charging Settings - "something went wrong" (502000)**
- 🔍 **Årsak**: Dette er et nyere endepunkt som kan være ustabilt eller ikke støttet av alle modeller
- 🛠️ **Løsning i appen**: Hvis dette feiler med 400/404, prøver appen `charge-mode` istedenfor
- ℹ️ **I Postman**: Dette er forventet for eldre modeller - prøv `3.2 Get Charge Mode` istedenfor
- 📝 **Støtte**: Nyere modeller (Megane E-Tech, nyere Zoe) bruker dette endepunktet

**💡 Tips**: Hvis begge charge-endepunktene feiler, støtter ikke bilen din endring av lademodus via API.

**4.4 Cancel HVAC - "Insufficient Battery Level" (400004)**
- 🔍 **Årsak**: Batterinivået er under 20% - Renault API nekter HVAC-operasjoner ved lavt batteri
- 🛠️ **Løsning**: Dette er en sikkerhetsfunksjon for å beskytte batteriet
- ℹ️ **I Postman**: Test denne kommandoen når batterinivået er over 20%
- 📝 **Forventet**: Dette er ikke en feil, men en funksjonell begrensning

#### ❌ Egentlige feil:

- **401 Unauthorized** - Token utløpt (kjør "1.3 Get JWT Token" på nytt)
- **403 Forbidden** - Operasjon ikke tillatt for din bilmodell
- **400 FUNCTIONAL (andre)** - Funksjon ikke støttet for din bilmodell

### Anbefalt teststrategi

For å finne hvilke endepunkter som fungerer for din bil:

1. **Test batteristatus først** (fungerer for alle elbiler):
   - ✅ `3.1 Get Battery Status` - Fungerer alltid

2. **Test lademodus** (prøv begge):
   - 🔄 `3.3 Get Charging Settings` (nyere modeller)
   - 🔄 `3.2 Get Charge Mode` (eldre modeller)
   - Én av disse bør fungere

3. **Test HVAC** (kun når batteri > 20%):
   - 🔄 `3.4 Get HVAC Status`
   - 🔄 `4.3 Start HVAC` (test med forsiktighet)
   - 🔄 `4.4 Cancel HVAC`

4. **Test andre funksjoner**:
   - ✅ `3.5 Get Location` - Fungerer for de fleste (ikke Zoe Phase 1)
   - ✅ `3.6 Get Cockpit` - Fungerer for de fleste (ikke Zoe Phase 1)
   - 🔄 `4.5-4.6 Pause/Resume Charging` - Nytt KCM-endepunkt, kan variere

## 📚 API Dokumentasjon

API-ene er basert på den offisielle Renault API dokumentasjonen og [renault-api Python-biblioteket](https://github.com/hacf-fr/renault-api).

### API Endepunkter

**Gigya (Autentisering):**
- `https://accounts.eu1.gigya.com`

**Kamereon (Kjøretøydata):**
- `https://api-wired-prod-1-euw1.wrd-aws.com`

## 🐛 Feilsøking

### Problem: Får 401 Unauthorized
**Løsning**: JWT token utløpt. Kjør "1.3 Get JWT Token" på nytt.

### Problem: Får 400 FUNCTIONAL error
**Løsning**: Funksjonen støttes ikke av din bilmodell. Se tabellen over for modellstøtte.

### Problem: Får tom respons eller timeout
**Løsning**: 
- Sjekk at bilen er tilkoblet (vekk fra dype garasjer)
- Vent noen sekunder og prøv igjen
- Renault API kan være treg til tider

### Problem: accountId eller VIN ikke satt
**Løsning**: Kjør hele autentiseringsflyten i rekkefølge (1.1 → 1.2 → 1.3 → 2.1 → 2.2)

### Problem: "Endpoint unavailable for this gateway" på Charge Mode
**Løsning**: Dette er normalt! Se seksjonen "Feilkoder og forventede feil" over. I appen håndteres dette automatisk med fallback-logikk.

### Problem: "Insufficient Battery Level" på HVAC
**Løsning**: Dette er en sikkerhetsfunksjon. Test kun når batterinivå > 20%.

## 🔄 Hvordan appen håndterer disse feilene

Appen har intelligent fallback-logikk som Postman ikke har:

```typescript
// Eksempel fra src/api/renault-api-client.ts
async getChargeMode() {
  try {
    // Prøv nyeste endepunkt først
    const settings = await get('charging-settings');
    return transform(settings);
  } catch (error) {
    // Hvis 400/404, prøv gammelt endepunkt
    if (error.status === 400 || error.status === 404) {
      return await get('charge-mode');
    }
    throw error;
  }
}
```

📖 **For detaljert analyse av de tre vanligste feilene**, se [ERROR_ANALYSIS.md](ERROR_ANALYSIS.md)

Derfor vil appen fungere selv om enkelte endepunkter feiler i Postman!

## 📞 Support

For spørsmål om API-ene, se:
- [Renault API GitHub](https://github.com/hacf-fr/renault-api)
- App-koden i [src/api/renault-api-client.ts](../src/api/renault-api-client.ts)

## 📝 Lisens

Denne Postman-samlingen er laget for testing og utvikling av Homey Renault/Dacia appen og følger samme lisens som hovedprosjektet.
