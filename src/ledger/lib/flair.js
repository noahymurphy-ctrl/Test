export const AVATARS = ['🦊', '🐼', '🐨', '🦁', '🐸', '🐙', '🦄', '🐝', '🐳', '🦉', '🐯', '🐶', '🐱', '🐰', '🐻', '🐧', '🦋', '🐢', '🦖', '🐬', '🌻', '🍄', '🌈', '⭐️', '🍓', '🥑', '🍩', '🌵', '🚀', '👑']

// Soft tints that work in light and dark mode.
export const TINTS = ['#FFD3C4', '#FFE3A8', '#D9F2B4', '#BDEBD9', '#B9E3F7', '#C9D3FF', '#DCCBFF', '#FFCCE5']

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const CATEGORIES = [
  ['🍕', 'pizza'],
  ['🍣', 'sushi'],
  ['🌮', 'taco|chipotle|burrito|mexican'],
  ['🍔', 'burger|mcdonald|wendy|five guys|in-n-out|shake shack'],
  ['☕️', 'coffee|starbucks|latte|cafe|dunkin'],
  ['🍦', 'ice cream|gelato|froyo|dessert'],
  ['🍺', 'beer|bar |drinks|wine|cocktail|pub'],
  ['🍽️', 'dinner|lunch|breakfast|brunch|restaurant|meal|takeout|doordash|ubereats|eat'],
  ['🛒', 'grocer|costco|walmart|target|trader|whole foods|safeway|kroger|aldi|publix|market|food'],
  ['⛽️', 'gas|fuel|shell|chevron|exxon'],
  ['🚕', 'uber|lyft|taxi|cab'],
  ['🅿️', 'parking|toll'],
  ['🚗', 'car|insurance|oil change|mechanic|tire'],
  ['✈️', 'flight|airline|plane|airport|delta|united|southwest'],
  ['🏨', 'hotel|airbnb|motel|vrbo|stay'],
  ['🏖️', 'vacation|trip|beach'],
  ['🏠', 'rent|mortgage|house|hoa'],
  ['💡', 'electric|utilit|power|water|sewer|trash'],
  ['📶', 'internet|wifi|comcast|xfinity|spectrum'],
  ['📱', 'phone|verizon|at&t|t-mobile|cell|iphone'],
  ['📺', 'netflix|hulu|disney|hbo|max|youtube|streaming|tv'],
  ['🎵', 'spotify|music|apple music'],
  ['🎬', 'movie|cinema|film|theater'],
  ['🎟️', 'ticket|concert|show|museum|zoo|park'],
  ['🎮', 'xbox|playstation|nintendo|steam|video game|game'],
  ['🎁', 'gift|present|birthday'],
  ['🎄', 'christmas|xmas|holiday'],
  ['🦃', 'thanksgiving|turkey'],
  ['💊', 'pharmacy|cvs|walgreens|medicine|prescription'],
  ['🩺', 'doctor|dentist|hospital|copay|medical'],
  ['🐾', 'dog|vet|pet|cat|chewy'],
  ['👟', 'clothes|shirt|shoes|zara|h&m|nike|jacket'],
  ['📚', 'book|school|tuition|class|textbook'],
  ['🏋️', 'gym|fitness|yoga'],
  ['💇', 'haircut|salon|barber|nails'],
  ['🧹', 'cleaning|cleaner|laundry'],
  ['📦', 'amazon|order|package|shipping'],
  ['🛠️', 'repair|hardware|home depot|lowe|tools'],
  ['🪴', 'garden|plant|flowers'],
  ['💸', 'loan|borrow|lent|cash|money|venmo|zelle'],
].map(([e, words]) => [e, new RegExp(words)])

export function guessEmoji(title) {
  const t = ` ${String(title || '').toLowerCase()} `
  for (const [e, re] of CATEGORIES) if (re.test(t)) return e
  return null
}

export const EMOJI_CHOICES = ['🧾', '🛒', '🍽️', '🍕', '☕️', '🍺', '⛽️', '🚕', '✈️', '🏨', '🏠', '💡', '📱', '📺', '🎬', '🎟️', '🎮', '🎁', '💊', '🐾', '👟', '📚', '🏋️', '📦', '🛠️', '💸', '🎉', '❤️']

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function firstName(name = '') {
  return String(name).trim().split(/\s+/)[0] || name
}
