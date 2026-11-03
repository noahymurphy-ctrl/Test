import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Emits ledger/sw.js at build time with the exact list of hashed files the
 * Evenly app needs, so the app works fully offline after the first launch.
 */
function evenlyServiceWorker() {
  return {
    name: 'evenly-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = new Set()
      const entry = Object.values(bundle).find(
        (c) => c.type === 'chunk' && c.isEntry && c.facadeModuleId?.includes('ledger'),
      )
      if (!entry) return
      const visit = (name) => {
        const c = bundle[name]
        if (!c || files.has(name)) return
        files.add(name)
        if (c.type !== 'chunk') return
        c.imports.forEach(visit)
        c.viteMetadata?.importedCss?.forEach((f) => files.add(f))
        c.viteMetadata?.importedAssets?.forEach((f) => files.add(f))
      }
      visit(entry.fileName)
      const precache = ['ledger/', 'ledger/manifest.webmanifest', 'ledger/icons/icon-192.png', 'ledger/icons/apple-touch-icon.png', ...files]
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10)
      const template = readFileSync(`${root}src/ledger/sw-template.js`, 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'ledger/sw.js',
        source: template
          .replace('__VERSION__', version)
          .replace('__PRECACHE__', JSON.stringify(precache)),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), evenlyServiceWorker()],
  base: '/Test/',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        ledger: `${root}ledger/index.html`,
      },
    },
  },
})
