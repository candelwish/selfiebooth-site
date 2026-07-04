# Iron Session — Clasp Deployment

## Files
| File | Purpose |
|------|---------|
| `Code.gs` | `doGet()` entry point + optional `saveSession()` Sheets hook |
| `index.html` | Full app (UI, program data, photos, video system, timers, logging) |
| `appsscript.json` | Manifest — V8, web app, anonymous access, America/Chicago |

## Deploy (existing clasp setup assumed)

```bash
# 1. Create the script project (or clone an existing one)
clasp create --title "Iron Session" --type webapp --rootDir .
#    OR to reuse an existing project:
#    echo '{"scriptId":"YOUR_SCRIPT_ID","rootDir":"."}' > .clasp.json

# 2. Push
clasp push

# 3. Deploy
clasp deploy --description "v1 — tracker + form guides"

# 4. Get the URL
clasp deployments
```

Web app URL format: `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
Add to iPhone Home Screen via Safari → Share → Add to Home Screen for an app-like experience.

## Configuration points (all in index.html)
- `PROGRAM` — exercises, sets, reps, notes, how-to steps
- `VIDEOS` — paste YouTube IDs to upgrade search buttons → inline embeds
- `PHOTOS` — free-exercise-db slugs (public domain)
- Rest presets — footer buttons (60/90/120s)

## Phase 2: Sheets-backed history
1. Create a Google Sheet, copy its ID into `SHEET_ID` in `Code.gs`
2. In `index.html`, inside the `finishBtn` handler after `store.set('history', hist)`, add:
   ```js
   if (typeof google !== 'undefined') {
     google.script.run.saveSession({day, minutes: Math.floor(secs/60), sets: logged, volume: vol});
   }
   ```
3. `clasp push && clasp deploy`

Note: `access: ANYONE_ANONYMOUS` keeps login friction out of your workout. Since
history lives in localStorage per device (until Phase 2), there's no personal data
exposed. Switch to `DOMAIN` access if you prefer it gated to your Google account.
