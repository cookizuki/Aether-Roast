# Aether & Roast — 3D Scrollytelling

Complete static React + Vite + Tailwind + Three.js experience. All UI, procedural geometry, shaders, interaction logic, data, and site styles are in `src/App.jsx`. `src/index.css` loads Tailwind. No database, API keys, GLB models, HDR files, or model downloads are needed.

## Run / build
```bash
npm install
npm run dev
npm run build
npm run preview
```
Deploy `dist/` to Vercel, Netlify, or GitHub Pages. Relative Vite base supports subpaths. Node 20.19+ or 22 recommended.

## What moves
- 0–25%: centered rotating cup, orbiting beans, oversized typography behind the canvas.
- 25–50%: right-side enlarged cup, approximately 35-degree tilt, anatomy callouts.
- 50–75%: left-side cup, flavor-driven PBR color and studio light changes.
- 75–100%: cup returns toward center and shrinks, camera retreats, beans scatter upward.
- Cursor camera parallax and frame-rate-independent exponential smoothing via MathUtils.lerp.
- CSS perspective cards calculate rotateX/rotateY and animate a pointer-controlled glare.
- Procedural Lathe/Cylinder/Torus cup, CanvasTexture label and sleeve, 28 shader steam particles, 22 instanced beans.
- Generated studio environment via drei Lightformer. No external environment assets.
- Accessible flavor buttons, keyboard navigation, reduced motion, WebGL fallback, copy-address feedback, and live local-time hours.

The code is tuned for 60fps (capped DPR 1.5, instancing, no postprocessing, low-resolution one-frame reflection capture, no React state updates per animation frame), but actual frame rate depends on hardware, browser, power settings and resolution. A constant frame rate cannot be guaranteed.

A commented `useGLTF('/coffee_cup.glb')` integration snippet is included in App.jsx. It makes no network request until you deliberately replace the procedural component.

Google Fonts are optional external typography assets with system fallbacks. Cafe details and prices are fictional illustrative content, not verified business information.

## Packages
```bash
npm install react react-dom three @react-three/fiber @react-three/drei framer-motion lucide-react
npm install -D vite@^6 @vitejs/plugin-react@^4 tailwindcss@^4 @tailwindcss/vite@^4
```
