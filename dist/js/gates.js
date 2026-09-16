// Gate logic shared by the page and by scripts/gates.test.js.
// A gate never blanket-rejects a 0x-hex string on shape alone: it only goes
// live when the candidate matches the value actually held in the registry
// for that record. Everything else renders inert, dated with record.state.

const ADDRESS_SHAPE = /^0x[a-fA-F0-9]{40}$/;
const URL_SHAPE = /^https:\/\/.+/;

export function isAddressShaped(value) {
  return typeof value === "string" && ADDRESS_SHAPE.test(value);
}

export function isUrlShaped(value) {
  return typeof value === "string" && URL_SHAPE.test(value);
}

/**
 * Resolve whether a contract-address record should render as a live gate.
 * @param {{address: string|null, state: string}} record
 * @param {string} [candidate] - an address-shaped string to test against the record
 */
export function resolveAddressGate(record, candidate) {
  if (record.state !== "stated" || !record.address) {
    return { active: false, reason: "record not stated", display: "inert" };
  }
  if (!isAddressShaped(record.address)) {
    return { active: false, reason: "stated value is not address-shaped", display: "inert" };
  }
  const target = candidate ?? record.address;
  if (!isAddressShaped(target)) {
    return { active: false, reason: "candidate is not address-shaped", display: "inert" };
  }
  if (target.toLowerCase() !== record.address.toLowerCase()) {
    return { active: false, reason: "candidate does not match stated record", display: "inert" };
  }
  return { active: true, reason: "matches stated record", display: "live", value: record.address };
}

/**
 * Resolve whether a social-link record should render as a clickable icon.
 * @param {{url: string|null, state: string}} record
 */
export function resolveSocialGate(record) {
  if (record.state !== "stated" || !record.url) {
    return { active: false, reason: "record not stated", href: null };
  }
  if (!isUrlShaped(record.url)) {
    return { active: false, reason: "stated value is not url-shaped", href: null };
  }
  return { active: true, reason: "matches stated record", href: record.url };
}

export function deriveHandleFromUrl(url) {
  if (!isUrlShaped(url)) return null;
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    return segments.length ? `@${segments[segments.length - 1]}` : null;
  } catch {
    return null;
  }
}
