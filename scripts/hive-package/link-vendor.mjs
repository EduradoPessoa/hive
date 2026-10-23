// Liga vendor/@paperclipai/* em node_modules/@paperclipai/* (veja scripts/build-hive-package.mjs).
//
// O tarball do `hive-agents` leva os pacotes internos em `vendor/` porque o `bundleDependencies`
// do npm falha em instalações globais. Este arquivo roda no `postinstall` e, se ele foi pulado
// (`npm i --ignore-scripts`), o comando `hive` o chama de novo ao iniciar.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function linkVendor() {
  const source = join(root, "vendor", "@paperclipai");
  if (!existsSync(source)) return;
  const target = join(root, "node_modules", "@paperclipai");
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(source)) {
    const link = join(target, name);
    try {
      lstatSync(link);
      continue; // já existe
    } catch {
      // ainda não existe: cria abaixo
    }
    try {
      // "junction" no Windows não pede administrador; nos outros sistemas vira link simbólico.
      symlinkSync(join(source, name), link, "junction");
    } catch {
      cpSync(join(source, name), link, { recursive: true });
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    linkVendor();
  } catch (error) {
    // No postinstall isso não pode derrubar a instalação: o `hive` tenta de novo ao iniciar.
    console.warn("[hive] não foi possível preparar os pacotes internos agora:", error.message);
  }
}
