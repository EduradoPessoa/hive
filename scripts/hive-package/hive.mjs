#!/usr/bin/env node
import { linkVendor } from "../lib/link-vendor.mjs";

// O aviso de atualização e o `update` da CLI olham o pacote `paperclipai` do projeto original,
// não o `hive-agents`: aqui eles ficam desligados.
process.env.PAPERCLIP_UPDATE_CHECK ??= "0";
if (process.argv[2] === "update") {
  console.log("Para atualizar o Hive, rode: npm install -g hive-agents@latest");
  process.exit(0);
}

linkVendor();
await import("../dist/index.js");
