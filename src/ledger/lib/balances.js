// Balance math. Every transaction is "payer covered `amount` for the people in
// `splits`", so payer gets +amount and each split person gets -share. A
// payment (settle-up) from A to B is just "A covered B", which nets them out.

export function netBalances(txns) {
  const net = {}
  for (const t of txns) {
    net[t.paidBy] = (net[t.paidBy] || 0) + t.amount
    for (const [id, share] of Object.entries(t.splits)) net[id] = (net[id] || 0) - share
  }
  return net
}

/** How much each other person owes `me` directly (negative = I owe them). */
export function pairBalances(txns, me) {
  const out = {}
  for (const t of txns) {
    for (const [id, share] of Object.entries(t.splits)) {
      if (id === t.paidBy || !share) continue
      if (t.paidBy === me) out[id] = (out[id] || 0) + share
      else if (id === me) out[t.paidBy] = (out[t.paidBy] || 0) - share
    }
  }
  return out
}

/** Fewest payments that settle everyone up (greedy largest-first matching). */
export function simplify(net) {
  const cred = []
  const debt = []
  for (const [id, v] of Object.entries(net)) {
    if (v > 0) cred.push([id, v])
    else if (v < 0) debt.push([id, -v])
  }
  cred.sort((a, b) => b[1] - a[1])
  debt.sort((a, b) => b[1] - a[1])
  const out = []
  let i = 0
  let j = 0
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i][1], cred[j][1])
    if (amt > 0) out.push({ from: debt[i][0], to: cred[j][0], amount: amt })
    debt[i][1] -= amt
    cred[j][1] -= amt
    if (!debt[i][1]) i++
    if (!cred[j][1]) j++
  }
  return out
}

/** Who owes whom, as a list of {from, to, amount}, honoring the simplify setting. */
export function debts(txns, simplifyOn) {
  if (simplifyOn) return simplify(netBalances(txns))
  const pair = {}
  for (const t of txns) {
    for (const [id, share] of Object.entries(t.splits)) {
      if (id === t.paidBy || !share) continue
      const [a, b] = id < t.paidBy ? [id, t.paidBy] : [t.paidBy, id]
      const k = `${a}|${b}`
      // positive = a owes b
      pair[k] = (pair[k] || 0) + (id === a ? share : -share)
    }
  }
  return Object.entries(pair)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const [a, b] = k.split('|')
      return v > 0 ? { from: a, to: b, amount: v } : { from: b, to: a, amount: -v }
    })
    .sort((x, y) => y.amount - x.amount)
}

/** Net effect of a transaction on one person (positive = they're owed more). */
export function effectFor(t, id) {
  return (t.paidBy === id ? t.amount : 0) - (t.splits[id] || 0)
}
