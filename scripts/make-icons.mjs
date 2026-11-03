// Renders the Evenly app icons to PNG with the preinstalled Chromium.
// Usage: node scripts/make-icons.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { mkdirSync } from 'node:fs'

const out = new URL('../public/ledger/icons/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

const svg = ({ radius, glyph }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6d5bff"/><stop offset=".55" stop-color="#a35bff"/><stop offset="1" stop-color="#ff6fb1"/>
    </linearGradient>
    <radialGradient id="h" cx=".25" cy=".15" r=".8">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3b1d8f" flood-opacity=".35"/></filter>
  </defs>
  <rect width="100" height="100" rx="${radius}" fill="url(#g)"/>
  <rect width="100" height="100" rx="${radius}" fill="url(#h)"/>
  <g filter="url(#s)" transform="translate(50 50) scale(${glyph}) translate(-50 -50)">
    <rect x="24" y="33" width="52" height="12" rx="6" fill="#fff"/>
    <rect x="24" y="55" width="52" height="12" rx="6" fill="#fff" fill-opacity=".88"/>
  </g>
</svg>`

const icons = [
  ['apple-touch-icon.png', 180, { radius: 0, glyph: 1 }],
  ['icon-192.png', 192, { radius: 22, glyph: 1 }],
  ['icon-512.png', 512, { radius: 22, glyph: 1 }],
  ['icon-maskable-512.png', 512, { radius: 0, glyph: 0.78 }],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, opts] of icons) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(opts)}</body></html>`)
  await page.screenshot({ path: out + name, omitBackground: true })
}
await browser.close()
console.log('icons written to', out)
