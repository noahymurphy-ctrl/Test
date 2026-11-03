# Evenly — family money, all square 💜

A PWA for keeping track of who owes who in the family. Lives at **`/Test/ledger/`** (source in `src/ledger/`, entry `ledger/index.html`); the rest of this repo is unrelated sites.

**Live:** https://noahymurphy-ctrl.github.io/Test/ledger/

## Features
- **Split** a bill (equally or custom amounts), log an **IOU**, or record **Paid back** — one composer with a big keypad
- Home shows what you're owed / owe, per-person balances, a family board, and the fewest payments to settle everyone up ("Simplify debts")
- Activity feed with search, filters and a monthly summary; edit, duplicate, delete with undo
- Per-person view with a "Nudge" reminder you can text
- Installable on iPhone (Share → Add to Home Screen) and Mac (Safari → File → Add to Dock); works offline; light/dark mode
- Mac keyboard shortcuts: `N` new · `S` settle · `1–4` tabs · `/` search
- JSON backup export/import

## Family sync (optional)
Out of the box, data stays on the device. To share one ledger across everyone's phones, Evenly uses a free Firebase project that you own:
1. Create a project at console.firebase.google.com
2. Authentication → Sign-in method → enable **Anonymous**
3. Firestore Database → create → Rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /families/{familyId}/records/{id} {
         allow read, write: if request.auth != null && familyId.size() >= 20;
       }
     }
   }
   ```
4. Project settings → add a Web app → paste its `firebaseConfig` into Evenly → Settings → Set up family sync
5. Settings → Invite family → share the link/QR. Anyone with the link can join, so keep it in the family.

## Develop
```
npm install
npm run dev        # open http://localhost:5173/Test/ledger/
npm run build      # also generates ledger/sw.js (offline cache)
node scripts/make-icons.mjs   # regenerate app icons (needs Playwright)
```

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
