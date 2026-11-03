// Renders the Glow app icons to PNG with the preinstalled Chromium.
// Usage: node scripts/make-habit-icons.mjs
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')

const out = new URL('../public/habits/icons/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

let wave = 'M -100 0'
for (let x = -100; x < 200; x += 50) wave += ` Q ${x + 12.5} -5 ${x + 25} 0 T ${x + 50} 0`
wave += ' V 140 H -100 Z'

const svg = ({ radius, scale }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx=".3" cy=".2" r="1">
      <stop offset="0" stop-color="#2a1a52"/><stop offset=".6" stop-color="#0f0b1f"/><stop offset="1" stop-color="#07060d"/>
    </radialGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ff5c9a" stop-opacity=".75"/><stop offset="1" stop-color="#ff5c9a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="liq" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="#ffd25e"/><stop offset=".5" stop-color="#ff5c9a"/><stop offset="1" stop-color="#7a3cff"/>
    </linearGradient>
    <radialGradient id="base" cx=".5" cy=".38" r=".65">
      <stop offset="0" stop-color="#a35bff" stop-opacity=".25"/><stop offset="1" stop-color="#4a1fa0" stop-opacity=".45"/>
    </radialGradient>
    <radialGradient id="gloss" cx=".34" cy=".24" r=".38">
      <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="c"><circle cx="50" cy="50" r="46"/></clipPath>
  </defs>
  <rect width="100" height="100" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">
    <circle cx="50" cy="54" r="48" fill="url(#glow)"/>
    <circle cx="50" cy="50" r="46" fill="url(#base)"/>
    <g clip-path="url(#c)">
      <g transform="translate(-12 44)"><path d="${wave}" fill="#ff5c9a" opacity=".5"/></g>
      <g transform="translate(0 46)"><path d="${wave}" fill="url(#liq)"/></g>
    </g>
    <ellipse cx="38" cy="27" rx="25" ry="15" fill="url(#gloss)" transform="rotate(-24 38 27)"/>
    <circle cx="50" cy="50" r="45.5" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1"/>
  </g>
</svg>`

const icons = [
  ['apple-touch-icon.png', 180, { radius: 0, scale: 0.7 }],
  ['icon-192.png', 192, { radius: 22, scale: 0.7 }],
  ['icon-512.png', 512, { radius: 22, scale: 0.7 }],
  ['icon-maskable-512.png', 512, { radius: 0, scale: 0.56 }],
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
