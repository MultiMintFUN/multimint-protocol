// Single source of truth for every externally-sourced fact on the site.
// Each record states its own confidence: "stated" | "absent" | "unconfirmed".
// Nothing outside this file may hardcode a chain id, address, url, or count.

export const REGISTRY = Object.freeze({
  chain: Object.freeze({
    name: "Robinhood Chain",
    chainIdHex: "0x1237",
    chainIdDec: 4663,
    rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
    state: "stated",
    source: "client statement, 2026-09-02, batch-level",
  }),

  contract: Object.freeze({
    address: null,
    state: "absent",
    note: "No contract has been deployed yet.",
  }),

  socials: Object.freeze([
    Object.freeze({ id: "x", label: "X", url: null, state: "unconfirmed" }),
    Object.freeze({ id: "github", label: "GitHub", url: null, state: "unconfirmed" }),
  ]),
});

export function socialCount() {
  return REGISTRY.socials.length;
}

export function liveSocialCount() {
  return REGISTRY.socials.filter((s) => s.state === "stated" && s.url).length;
}
