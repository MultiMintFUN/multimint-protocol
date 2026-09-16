// Builds dist/: only what a static host needs to deploy.
// Excludes brand/, reference/, node_modules/, and dev-only scripts
// (gates.test.js, serve.js, build.js itself never ship).
import { readFile, writeFile, rm, mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

const DEPLOYABLE_JS = ["registry.js", "gates.js", "main.js"];

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await mkdir(path.join(dist, "css"), { recursive: true });
  await mkdir(path.join(dist, "js"), { recursive: true });
  await mkdir(path.join(dist, "assets"), { recursive: true });

  // css/
  await cp(path.join(root, "styles"), path.join(dist, "css"), { recursive: true });

  // js/ — only the runtime modules the page actually loads, not test/dev tooling
  for (const file of DEPLOYABLE_JS) {
    await cp(path.join(root, "scripts", file), path.join(dist, "js", file));
  }

  // assets/ — public/ becomes assets/ in dist
  await cp(path.join(root, "public"), path.join(dist, "assets"), { recursive: true });

  // index.html — rewrite root-relative dev paths to the dist layout
  let html = await readFile(path.join(root, "index.html"), "utf8");
  html = html
    .replaceAll("/public/", "/assets/")
    .replaceAll("/styles/", "/css/")
    .replaceAll("/scripts/", "/js/");
  await writeFile(path.join(dist, "index.html"), html);

  console.log(`Built ${path.relative(root, dist)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
