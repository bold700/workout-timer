# Sonos OAuth Setup Instructies

## Probleem: "Oops, there was a problem" error

Als je deze error ziet na het klikken op "Connect to Sonos", betekent dit dat de redirect URI niet is geregistreerd in de Sonos Developer Console.

## Oplossing: Redirect URI toevoegen

### Stap 1: Ga naar Sonos Developer Console
1. Ga naar: https://integration.sonos.com/
2. Log in met je Sonos account
3. Selecteer je app (Client ID: `24980fc6-b0b3-43d0-982a-0e4314c9e2c4`)

### Stap 2: Voeg Redirect URI toe

**BELANGRIJK:** Sonos accepteert alleen URLs die beginnen met `https://`. Custom URL schemes (zoals `com.workouttimer.app://callback`) worden niet geaccepteerd.

Voeg deze redirect URI toe in de Sonos Developer Console:

```
https://bold700.github.io/workout-timer/callback
```

Deze URL werkt voor zowel de web versie als de native iOS/Android app. De callback pagina detecteert automatisch of je in een native app bent en redirect dan naar de app via een deep link.

### Stap 3: Waar voeg je ze toe?

1. In de Sonos Developer Console, ga naar je app configuratie
2. Zoek naar "Redirect URIs" of "Allowed Redirect URIs"
3. Voeg elke URI toe (één per regel of gescheiden door komma's)
4. **Sla op**

### Stap 4: Test opnieuw

1. Herstart de app in Xcode
2. Probeer opnieuw te verbinden met Sonos
3. Check de Xcode console voor de redirect URI die wordt gebruikt:
   - Zoek naar: `[Sonos Auth] Redirect URI:`
   - Deze moet exact overeenkomen met wat je in Sonos hebt geregistreerd

## Debugging

### Check welke redirect URI wordt gebruikt:

1. Open de app in Xcode
2. Open de Console (View → Debug Area → Activate Console)
3. Klik op "Connect to Sonos" in de app
4. Kijk in de console naar:
   ```
   [Sonos Auth] Redirect URI: com.workouttimer.app://callback
   [Sonos Auth] Is Native: true
   ```

### Belangrijk:
- De redirect URI moet **exact** overeenkomen (inclusief hoofdletters/kleine letters)
- Geen trailing slashes (behalve na `://`)
- Voor native apps: gebruik het custom URL scheme `com.workouttimer.app://callback`
- Voor web: gebruik de volledige URL met `https://`

## Veelvoorkomende problemen

### "Invalid redirect URI"
- Check of de URI exact overeenkomt met wat in Sonos is geregistreerd
- Check of er geen extra spaties of speciale tekens zijn

### App opent niet na Sonos login
- Check of de URL scheme correct is geregistreerd in `Info.plist`
- Check of `capacitor.config.ts` de juiste scheme heeft
- Test de deep link handmatig: open Safari en typ `com.workouttimer.app://callback?code=test&state=test`

### Sandbox extension errors in Xcode
- Deze zijn meestal niet kritiek en kunnen worden genegeerd
- Ze komen voor in de simulator en zijn vaak niet relevant voor de functionaliteit
