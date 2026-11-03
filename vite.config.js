import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Emits <dir>/sw.js at build time with the exact list of hashed files an app
 * needs, so it works fully offline after the first launch.
 */
function appServiceWorker(dir, template) {
  return {
    name: `${dir}-service-worker`,
    apply: 'build',
    generateBundle(_, bundle) {
      const files = new Set()
      const entry = Object.values(bundle).find(
        (c) => c.type === 'chunk' && c.isEntry && c.facadeModuleId?.endsWith(`/${dir}/index.html`),
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
      const precache = [`${dir}/`, `${dir}/manifest.webmanifest`, `${dir}/icons/icon-192.png`, `${dir}/icons/apple-touch-icon.png`, ...files]
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: `${dir}/sw.js`,
        source: readFileSync(`${root}${template}`, 'utf8')
          .replace('__VERSION__', version)
          .replace('__PRECACHE__', JSON.stringify(precache)),
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    appServiceWorker('ledger', 'src/ledger/sw-template.js'),
    appServiceWorker('habits', 'src/habits/sw-template.js'),
  ],
  base: '/Test/',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        ledger: `${root}ledger/index.html`,
        habits: `${root}habits/index.html`,
      },
    },
  },
})
