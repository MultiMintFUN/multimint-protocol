import assert from "node:assert/strict";
import { REGISTRY, socialCount, liveSocialCount } from "./registry.js";
import {
  isAddressShaped,
  isUrlShaped,
  resolveAddressGate,
  resolveSocialGate,
  deriveHandleFromUrl,
} from "./gates.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

// --- registry state discipline -------------------------------------------

test("every registry record declares a valid state", () => {
  const valid = new Set(["stated", "absent", "unconfirmed"]);
  assert.ok(valid.has(REGISTRY.chain.state));
  assert.ok(valid.has(REGISTRY.contract.state));
  for (const s of REGISTRY.socials) assert.ok(valid.has(s.state));
});

test("social count is derived from registry length, not hardcoded", () => {
  assert.equal(socialCount(), REGISTRY.socials.length);
  assert.equal(socialCount(), 2);
});

// --- CA gate: reflects whatever the registry currently holds --------------

test("CA gate state matches the live registry record, whether absent or stated", () => {
  const gate = resolveAddressGate(REGISTRY.contract);
  if (REGISTRY.contract.state === "stated" && REGISTRY.contract.address) {
    assert.equal(gate.active, true, "a stated, address-shaped record must gate live");
    assert.equal(gate.display, "live");
    assert.equal(gate.value, REGISTRY.contract.address);
  } else {
    assert.equal(gate.active, false, "an absent/unconfirmed record must never gate live");
    assert.equal(gate.display, "inert");
  }
});

// --- CA gate: prove it can fail on throwaway copy once a CA IS stated ----

const STATED_CONTRACT = Object.freeze({
  address: "0x1234567890abcdef1234567890abcdef12345678",
  state: "stated",
});

test("address gate accepts the exact stated address", () => {
  const gate = resolveAddressGate(STATED_CONTRACT, STATED_CONTRACT.address);
  assert.equal(gate.active, true);
});

test("address gate REJECTS a throwaway address-shaped string that differs by one char", () => {
  const throwaway = "0x1234567890abcdef1234567890abcdef12345679"; // last digit changed
  const gate = resolveAddressGate(STATED_CONTRACT, throwaway);
  assert.equal(gate.active, false, "gate must fail closed on a mismatched but address-shaped string");
});

test("address gate REJECTS malformed hex (too short) even though it starts with 0x", () => {
  const throwaway = "0xdeadbeef";
  assert.equal(isAddressShaped(throwaway), false);
  const gate = resolveAddressGate(STATED_CONTRACT, throwaway);
  assert.equal(gate.active, false);
});

test("address gate does NOT blanket-reject every 0x hex string — a matching one passes", () => {
  // this is the inverse check for the GATE WARNING rule: shape alone is not
  // grounds for rejection, only mismatch against the stated record is.
  const matching = "0x" + STATED_CONTRACT.address.slice(2).toUpperCase();
  const gate = resolveAddressGate(STATED_CONTRACT, matching);
  assert.equal(gate.active, true, "case-insensitive match against stated record must pass");
});

// --- social gates ----------------------------------------------------------

test("both social records are unconfirmed today, so both gates are inactive", () => {
  for (const s of REGISTRY.socials) {
    const gate = resolveSocialGate(s);
    assert.equal(gate.active, false);
    assert.equal(gate.href, null);
  }
  assert.equal(liveSocialCount(), 0);
});

test("social gate REJECTS a throwaway non-https url even if state claims stated", () => {
  const throwaway = { url: "javascript:alert(1)", state: "stated" };
  const gate = resolveSocialGate(throwaway);
  assert.equal(gate.active, false, "gate must fail closed on a non-https throwaway value");
});

test("social gate accepts a well-formed https url once stated", () => {
  const good = { url: "https://x.com/multimintfun", state: "stated" };
  const gate = resolveSocialGate(good);
  assert.equal(gate.active, true);
  assert.equal(deriveHandleFromUrl(good.url), "@multimintfun");
});

test("isUrlShaped rejects throwaway garbage", () => {
  assert.equal(isUrlShaped("not a url"), false);
  assert.equal(isUrlShaped("http://insecure.example"), false); // must be https
});

console.log(`\n${passed} gate checks passed.`);
