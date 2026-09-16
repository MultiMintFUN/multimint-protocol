import { REGISTRY } from "./registry.js";
import { resolveAddressGate, resolveSocialGate, deriveHandleFromUrl } from "./gates.js";

function applyContractGate() {
  const bar = document.querySelector('[data-gate="contract-address"]');
  const valueEl = bar.querySelector('[data-role="ca-value"]');
  const copyBtn = bar.querySelector('[data-role="ca-copy"]');
  const noteEl = bar.querySelector('[data-role="ca-note"]');
  const gate = resolveAddressGate(REGISTRY.contract);

  bar.dataset.state = REGISTRY.contract.state;

  if (gate.active) {
    valueEl.textContent = gate.value;
    copyBtn.disabled = false;
    copyBtn.removeAttribute("aria-disabled");
    noteEl.textContent = "stated · verified against registry";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(gate.value);
        copyBtn.textContent = "Copied";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1400);
      } catch {
        /* clipboard unavailable — no-op, control stays visibly a button */
      }
    });
  } else {
    valueEl.textContent = "Not yet deployed";
    copyBtn.disabled = true;
    copyBtn.setAttribute("aria-disabled", "true");
    noteEl.textContent = `${REGISTRY.contract.state} · ${REGISTRY.contract.note ?? "no address on file"}`;
  }
}

function applySocialGate(id) {
  const record = REGISTRY.socials.find((s) => s.id === id);
  const el = document.querySelector(`[data-role="social-${id}"]`);
  if (!record || !el) return;
  const gate = resolveSocialGate(record);
  el.dataset.state = record.state;

  if (gate.active) {
    el.href = gate.href;
    el.removeAttribute("tabindex");
    el.removeAttribute("aria-disabled");
    const handle = deriveHandleFromUrl(gate.href);
    el.setAttribute("aria-label", `${record.label}${handle ? ` — ${handle}` : ""}`);
  } else {
    el.removeAttribute("href");
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("aria-label", `${record.label} — ${record.state}, link inert`);
  }
}

function applyMintCta() {
  const btn = document.querySelector('[data-gate="mint-cta"]');
  const gate = resolveAddressGate(REGISTRY.contract);
  if (gate.active) {
    btn.disabled = false;
    btn.removeAttribute("aria-disabled");
    btn.textContent = "Mint";
  }
  // else: leave the inert copy already in the markup — no fabricated state.
}

function applyRegistryCount() {
  const el = document.querySelector('[data-role="registry-count-value"]');
  if (!el) return;
  const count = 1 + REGISTRY.socials.length; // contract record + each social record
  el.textContent = String(count);
}

applyContractGate();
for (const s of REGISTRY.socials) applySocialGate(s.id);
applyMintCta();
applyRegistryCount();
