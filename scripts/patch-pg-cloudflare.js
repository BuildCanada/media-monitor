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
