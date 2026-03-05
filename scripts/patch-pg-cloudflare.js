// Copies pg-cloudflare workerd files into the OpenNext build output.
// Next.js traces the "default" export (empty.js) instead of the "workerd" export,
// so the real implementation is missing from the bundle.
// See: https://github.com/brianc/node-postgres/issues/3349

const fs = require("fs");
const path = require("path");

const src = path.resolve("node_modules/pg-cloudflare");
const dest = path.resolve(".open-next/server-functions/default/node_modules/pg-cloudflare");

// dist/index.js (workerd require)
fs.copyFileSync(path.join(src, "dist/index.js"), path.join(dest, "dist/index.js"));

// esm/index.mjs (workerd import)
fs.mkdirSync(path.join(dest, "esm"), { recursive: true });
fs.copyFileSync(path.join(src, "esm/index.mjs"), path.join(dest, "esm/index.mjs"));

console.log("[patch] Copied pg-cloudflare workerd files into OpenNext bundle");

// Patch handler.mjs to resolve the Turbopack-hashed pg module name
const handlerPath = path.resolve(
  ".open-next/server-functions/default/handler.mjs"
);
let handler = fs.readFileSync(handlerPath, "utf8");

// Find the hashed pg module name (pg-<hex>) in the bundle
const pgHashMatch = handler.match(/\bpg-[a-f0-9]{16}\b/);
if (pgHashMatch) {
  const pgHash = pgHashMatch[0];
  // Add a case to the externalImport switch: hashed name → real "pg" import
  handler = handler.replace(
    'case"next/dist/compiled/@vercel/og/index.node.js"',
    `case"${pgHash}":raw=await import("pg");break;case"next/dist/compiled/@vercel/og/index.node.js"`
  );
  fs.writeFileSync(handlerPath, handler);
  console.log(`[patch] Mapped ${pgHash} → pg in externalImport switch`);
} else {
  console.warn(
    "[patch] No hashed pg module name found — skipping handler patch"
  );
}
