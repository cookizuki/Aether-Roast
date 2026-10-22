# Rendering and scrolling changes

All changes are local, uncommitted and unpushed. No deployment was performed.

## Findings and implementation

- Startup: the original production JavaScript was one 1,399.74 kB chunk (401.40 kB gzip). React HTML now loads separately from Three/Fiber/Drei. Initial JS is 378.12 kB (120.99 kB gzip), with a lazy scene of 996.95 kB (273.75 kB gzip). Total JS is only slightly smaller; this is primarily startup scheduling and code separation, not a comparable reduction in total transfer. CSS is 29.90 kB (7.62 kB gzip); previously 8.64 kB (2.39 kB gzip) plus the stylesheet embedded inside the JS bundle.
- GPU cost: replaced physical/clearcoat materials with standard materials, removed two point lights, lowered local one-shot environment resolution from 128 to 64, and capped initial DPR at 1.25 (1 on modest hardware). No external model/HDR dependency. Beans were already instanced and remain so; the environment already captured once and still does.
- Quality: normal/reduced tiers use 64/48 cup segments, 18/8 beans and 18/8 steam particles. Reduced effects/motion removes steam and continuous decorative movement. Hardware signals seed the tier. Sustained frame timing adjusts DPR only (floor .75), after startup warmup, two slow windows or five recovery windows and a ten-second cooldown. Geometry/materials are not rebuilt during automatic adaptation. The keyboard-accessible Reduced effects toggle persists in localStorage when available.
- CPU: frame state remains in refs and Three objects. Delta is clamped and smoothing is exponential. Chapter state updates only when the integer chapter changes. Pointer parallax uses one cleaned-up listener and respects touch, fine-pointer capability and reduced motion. Card tilt caches bounds on entry rather than reading layout on every move.
- Scroll/layout: actual section positions and document scroll end now drive navigation, active chapter and scene progress. Layout measurement happens on resize/ResizeObserver, not scrolling or useFrame. Content flows naturally on short screens; the finale sticky offset uses its actual height. Mobile cup positions reserve space for text.
- Compositing: removed full-screen grain and panel backdrop filters, plus persistent card will-change. Styles moved out of React. Tailwind scans src only.
- Lifecycle: removed the disposable capability-check WebGL context. HTML remains available during scene loading and failures. Context loss unmounts the scene and exposes an explicit Retry 3D action. Rendering stops while document.hidden; visible scenes retain an always-running loop to preserve animation and transitions. Textures are created/disposed in effects for Strict Mode cleanup; R3F manages declarative geometries/materials.
- Sleeve fix: preserved the taper and +.025 body/sleeve and +.012 sleeve/logo clearances, bump scale .004, paper texture pattern/repeat, and label polygon offsets. Added label anisotropy. Lighting/material changes may slightly alter the finish; colors and branding data are unchanged.

## Files

- src/App.jsx: HTML, lazy scene boundary/loading/retry, settings and tilt behavior.
- src/CoffeeScene.jsx: procedural cup, preserved sleeve fix, scene quality, pointer/render lifecycle.
- src/quality.js: device defaults and sustained-performance controller.
- src/experience.js: chapter measurements, navigation, persisted settings, reactive motion preference.
- src/app.css: original visual styles extracted from App.
- src/experience.css: responsive layout and compositing changes.
- src/index.css: constrain Tailwind scanning to source.
- index.html: empty favicon prevents the browser requesting a missing favicon; existing fonts remain.
- tests/performance.test.mjs: quality hysteresis/recovery and unequal-height chapter tests.
- tests/browser-smoke.mjs: diagnostic CDP browser exercise; requires a local preview on 4173 and isolated Chrome debugging on 9223. Logs results rather than asserting screenshots.

## Verification

- npm run build: passed. Vite still warns about the ~997 kB deferred scene chunk.
- node tests/performance.test.mjs: 4 tests passed.
- git diff --check: passed.
- Headless Chrome production checks: scene reaches ready; four desktop destinations at 1440x900; four mobile destinations at 390x667 (within subpixel rounding); three flavor buttons; saved Reduced effects; context loss fallback and successful explicit retry.
- 667x390 landscape: no horizontal overflow and finale footer bottom at ~305px within a 390px viewport after scrolling to the end.
- Unsupported WebGL simulated by returning null for WebGL contexts: fallback shown, four chapters and three flavor controls retained. Expected renderer error is logged for this deliberately induced failure.
- Live reduced-motion media changes: setting on produces data-reduced=true; setting off restores false.
- Mobile finale screenshots inspected and cup/heading overlap corrected.
- Normal browser run: no uncaught runtime exceptions or missing asset reports after adding favicon. Three.js Clock deprecation and driver shader precision warnings were observed. Context-loss tests log the expected renderer lifecycle messages.

No before/after FPS or GPU timings were collected. Lower rendering cost is expected from the concrete reductions above; universal 60fps is not claimed. Shader startup timing, sustained performance on physical phones, mobile address-bar changes, real tab background/restore, pointer/tilt visual feel, and extended sleeve shimmer checks still require manual testing. Headless screenshots do not prove temporal surface stability. Strict Mode cleanup was reviewed in code but not separately exercised in the production build.

## Local review

Run npm run build then npm run preview -- --port 4173 and open http://localhost:4173.

Navigate every chapter, choose each flavor, inspect sleeve/logo while rotating with the pointer, and test keyboard focus and the persisted Reduced effects button. Resize/rotate a phone, scroll the finale all the way down, change the OS motion preference, and background/restore the tab. Compare normal and reduced effects using browser Performance tools on the actual target hardware. Use the browser console WebGL lose-context extension if you want to retest the explicit fallback/retry path.
