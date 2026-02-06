# Encryption Key Setup

## Problem
Du så denne feilen fordi `ENCRYPTION_KEY` ikke var konfigurert. Denne nøkkelen brukes til å kryptere brukernavn og passord som lagres i Homey.

## Løsning
En `.env.json` fil er nå opprettet med en tilfeldig 256-bit krypteringsnøkkel.

⚠️ **VIKTIG**: `.env.json` filen er lagt til i `.gitignore` og skal ALDRI committes til Git!

## Hva må du gjøre nå?

### Alternativ 1: Re-pair enheten (Anbefalt)
1. Slett din eksisterende Renault Zoe/Dacia Spring enhet i Homey
2. Legg til enheten på nytt (pair)
3. Skriv inn brukernavn og passord
4. Nå vil credentials krypteres med den nye nøkkelen

### Alternativ 2: Bruk re-autentisering
1. Gå til enhetsinnstillingene i Homey
2. Skriv inn brukernavn og passord på nytt
3. Lagre
4. Systemet vil re-autentisere og lagre med ny kryptering

## For produksjon
Hvis du skal deploye denne appen til Homey App Store, må du:
1. Legge til `ENCRYPTION_KEY` som en miljøvariabel i Homey Developer portal
2. Bruke samme nøkkel for alle installasjoner

## Teknisk forklaring
- Credentials lagres kryptert med AES-256-CTR
- Uten krypteringsnøkkel, kan ikke eksisterende krypterte credentials dekrypteres
- Den nye koden håndterer dette bedre ved å gi tydelige feilmeldinger
