// Loaded on demand only when family sync is turned on.
import { initializeApp, deleteApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInAnonymously } from 'firebase/auth'
import { getFirestore, collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'

const clean = (r) => JSON.parse(JSON.stringify(r))

export async function connect(config, familyId) {
  const app = initializeApp(config, `evenly-${familyId}-${Date.now()}`)
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
  await signInAnonymously(auth)
  const db = getFirestore(app)
  const col = collection(db, 'families', familyId, 'records')
  let unsub = () => {}

  return {
    listen(onData, onError) {
      unsub = onSnapshot(
        col,
        { includeMetadataChanges: true },
        (snap) => onData(snap.docs.map((d) => d.data()), snap.metadata.fromCache),
        onError,
      )
    },
    push: (rec) => setDoc(doc(col, rec.id), clean(rec)),
    async pushMany(recs) {
      for (let i = 0; i < recs.length; i += 400) {
        const batch = writeBatch(db)
        recs.slice(i, i + 400).forEach((r) => batch.set(doc(col, r.id), clean(r)))
        await batch.commit()
      }
    },
    async stop() {
      unsub()
      await deleteApp(app)
    },
  }
}
