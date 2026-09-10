# Aero

A small Frutiger Aero desktop for GitHub Pages. Plain HTML, CSS, and JavaScript; no framework, build step, CDN, account, or analytics. The entire app, including its original wallpaper, is roughly 220 KB before transfer compression.

## Run locally

Open `index.html` for a quick look. For full browser and offline features, serve this folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Any static HTTP server works. Service workers require HTTPS or localhost; they cannot install when opening a `file://` URL. Settings are stored per browser and origin.

## Publish on GitHub Pages

1. Create a GitHub repository, or use one you already own.
2. Upload the **contents** of this folder to the repository root. Keep `index.html`, `styles.css`, `app.js`, `games.js`, `sw.js`, `welcome.html`, `.nojekyll`, and the `assets` folder together.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then your branch (usually `main`) and **/(root)**. Save.
4. Open the URL shown by GitHub after publication. Project URLs such as `https://username.github.io/repository/` are supported: all asset and service-worker paths are relative.

If you prefer the repository’s `docs` folder, place all these files there and select `/docs` as the publishing source. No custom domain or paid hosting is required. This delivery does not create or publish a GitHub repository for you.

Official instructions: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Add HTML games later

The delivered library is deliberately empty. Create a folder such as `games/my-game/`, place its HTML and assets there, then edit `games.js`:

```js
window.AERO_GAMES = [
  {
    title: 'My game',
    description: 'A short description of the game.',
    path: 'games/my-game/index.html'
  }
];
```

Games load only when clicked. Closing a game or leaving Games removes its iframe, stopping its scripts and sound. The default game sandbox allows JavaScript and pointer lock, with fullscreen/gamepad permission where supported. It deliberately has an opaque origin: games requiring localStorage, same-origin fetch, or external integrations may need adjusted sandbox permissions or hosting on a separate origin. Do not add `allow-same-origin` to untrusted games hosted alongside this app.

For offline game availability, add every required game file to the `FILES` array in `sw.js`. The app does not download or cache games automatically.

## Browser preview and optional proxy

The Browser tab is a lightweight iframe preview, **not a full web browser or a built-in proxy**. GitHub Pages cannot run a proxy backend. Direct preview accepts HTTPS destinations; the included local welcome page is the only HTTP exception on localhost. Sites may refuse embedding through `X-Frame-Options` or CSP. Browser security prevents reliably detecting that refusal; a frame’s `load` event is not proof of success. The app therefore keeps a clear “blank or refused?” fallback and an **Open in a new tab** button available. It does not claim to bypass site or network restrictions.

Back/forward track the last 50 addresses entered through this interface. Cross-origin navigation inside the iframe cannot reliably update the address bar or this history. Reload reloads the address known to Aero. External frames are unloaded when you leave Browser and recreated when you return, which can lose unsaved state inside the external page. Sites requiring unrestricted popups, downloads, top-level navigation, or other permissions may need their own tab.

To connect your own backend:

1. Run a web-proxy service on a **separate HTTPS origin** that you control.
2. In **Settings → Browser preferences**, enter a template such as `https://your-server.example/browse?url={url}`.
3. Turn on **Use my proxy backend**.

Aero URL-encodes the target and substitutes it for `{url}`, then loads the resulting address in its preview frame. For example, `https://example.com/` becomes `https%3A%2F%2Fexample.com%2F`. The proxy endpoint must return a complete embeddable HTML document and handle the resource/link rewriting its implementation requires. A JSON fetch endpoint, a raw CORS relay, or an endpoint needing a special client transport will not work with this generic template alone. The proxy must permit embedding from your Pages origin. Secrets do not belong in frontend code or the URL template. No public proxy service is selected or contacted by default. Without a backend, leave this option off.

References: [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [iframe behavior and limitations](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).

## Customize and extend

- All setting definitions, ranges, defaults, and preset palettes live near the top of `app.js`.
- CSS custom properties in `styles.css` control shared colors, glass, radii, shadows, and typography.
- Preferences save automatically after a brief debounce. Each section can be reset independently. Restore all defaults asks before replacing your preferences.
- Presets apply a palette, wallpaper intensity, and low-power state; they preserve your other personal settings.
- Custom palettes can reduce contrast; the default theme is intended to keep text legible. Panel opacity has a lower bound so controls remain usable.
- No font download is needed. The site uses available system fonts, with fallbacks.

## Sound and performance

Audio is generated locally with Web Audio. There are no audio downloads. Ambient sound starts paused on every page load and requires an explicit Play click. Three profiles provide filtered surf noise, breeze with occasional synthesized birds, or airy sustained tones. Button sounds start only after a real button/link activation. Mute affects both ambient and button sounds. Volume settings and sound choices persist, but playback state does not.

Low-power mode disables the landscape wallpaper, glass blur, and costly shadows; simplifies the audio graph; and limits particles to six at 15 FPS. Normal effects cap particles at 8 / 20 / 40 for Low / Balanced / High quality. Off disables particles. Frame-rate settings control **Aero’s particle loop only**, not the browser, embedded games, CSS painting, or external pages. Animation updates use `requestAnimationFrame`; no permanent timer runs for reduced-motion or static bubbles. System reduced-motion preferences always take precedence. Hidden pages stop the animation loop and ambient nodes and suspend the audio context; returning resumes ambient sound only if you had started it.

The interface has been designed for modest hardware, but actual speed depends on the device and on external sites or future games. There has been no physical Chromebook benchmark.

## Offline use and updates

After a successful first visit over HTTPS/localhost, the service worker caches the app shell, welcome page, and wallpaper. Those features then work offline. External websites and proxy browsing still need a connection. Browser storage restrictions or private modes may disable offline storage; the site still works online, and settings show “Session only” if localStorage cannot be written.

When publishing changed files, increment `VERSION` in `sw.js` (for example, `aero-v4` → `aero-v5`). The updated worker refreshes the shell cache. Reload once the new worker is installed. Existing open tabs may need another reload to use all updated assets. Caches are isolated by repository scope; the app does not erase unrelated sites’ caches.

## Files

```text
index.html              Main interface and accessible navigation
styles.css              Responsive Aero styling and theme variables
app.js                  Settings, sound engine, particles, browser, navigation
games.js                Empty game registry ready for future entries
welcome.html            Offline browser demonstration
sw.js                   Offline app-shell cache
assets/favicon.svg      Tiny vector icon
assets/wallpaper.webp    Original generated landscape, compressed for the web
.nojekyll               Publish files directly on GitHub Pages
```

An optional `set_aero_preset` WebMCP tool is registered only when the browser supports `document.modelContext`. It uses the same actions as the visible preset buttons and is not needed for normal operation.
