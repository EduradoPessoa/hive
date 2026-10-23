#!/usr/bin/env node
/**
 * build-hive-package.mjs — monta o pacote `hive-agents` (um único pacote npm
 * para instalar o Hive: `npm i -g hive-agents` / `npx hive-agents`).
 *
 * Por que assim. O Hive é um fork do Paperclip: o monorepo tem 34 pacotes
 * publicáveis com o escopo `@paperclipai/*`, e a CLI carrega o servidor em
 * tempo de execução (`import("@paperclipai/server")`). Publicar tudo com outro
 * nome exigiria renomear milhares de linhas e criar uma organização no npm. Em
 * vez disso, o `hive-agents`:
 *
 *   - é a CLI empacotada pelo esbuild (como o `paperclipai` já é);
 *   - leva dentro do próprio tarball, em `vendor/@paperclipai/*`, os
 *     pacotes internos de que o servidor precisa (ligados em `node_modules` pelo
 *     `postinstall`, veja `scripts/hive-package/`), cada
 *     um empacotado pelo `pnpm pack` — que aplica `publishConfig` e troca
 *     `workspace:*` por versões, exatamente como numa publicação de verdade;
 *   - declara como dependências normais só os pacotes de terceiros (express,
 *     embedded-postgres…), que o npm resolve na instalação.
 *
 * Resultado: um único `npm publish`, sem escopo novo, sem tocar no código-fonte.
 *
 * Uso:
 *   node scripts/build-hive-package.mjs                 # compila e empacota
 *   node scripts/build-hive-package.mjs --skip-build    # reaproveita os dist/
 *   node scripts/build-hive-package.mjs --version 0.1.0-beta.1
 *
 * Saída: `dist-hive/hive-agents-<versão>.tgz` (e a pasta `dist-hive/stage/`).
 */

import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, relative as pathRelative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist-hive");
const stage = join(outDir, "stage");

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const versionIdx = args.indexOf("--version");
const versionOverride = versionIdx >= 0 ? args[versionIdx + 1] : undefined;

const isWindows = process.platform === "win32";
const gitBash = ["C:/Program Files/Git/bin/bash.exe", "C:/Program Files (x86)/Git/bin/bash.exe"].find(existsSync);
const log = (msg) => console.log(`\n==> ${msg}`);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Roda um comando herdando a saída. `pnpm` no Windows é `pnpm.cmd`. */
function run(cmd, cmdArgs, options = {}) {
  const bin = isWindows && (cmd === "pnpm" || cmd === "npm") ? `${cmd}.cmd` : cmd;
  const env = { ...process.env, ...options.env };
  // Os `build` dos pacotes usam `rm -rf`, `mkdir -p` e `cp`: no Windows o pnpm os roda pelo
  // cmd.exe e eles falham. Usamos o bash do Git, que quem clonou o repositório já tem.
  if (isWindows && !env.npm_config_script_shell && gitBash) env.npm_config_script_shell = gitBash;
  const result = spawnSync(bin, cmdArgs, { cwd: root, stdio: "inherit", shell: isWindows, ...options, env });
  if (result.status !== 0) throw new Error(`Falhou: ${cmd} ${cmdArgs.join(" ")}`);
}

// ── 1. Compila ───────────────────────────────────────────────────────────────
if (!skipBuild) {
  log("Compilando as dependências do servidor");
  run("pnpm", ["run", "preflight:workspace-links"]);
  // O `build` do runner (`@paperclipai/paperclip-runner`) roda, além de compilar, verificações de
  // inventário e de contrato que dependem do corpus de avaliação do projeto original
  // (`paperclip-evals`), que não faz parte deste repositório. Para o pacote só importa o que é
  // compilado: então compilamos o TypeScript do runner e pulamos essas verificações.
  run("pnpm", ["--filter", "@paperclipai/server...", "--filter", "!@paperclipai/server", "--filter", "!@paperclipai/paperclip-runner", "--if-present", "run", "build"]);
  log("Compilando o runner (só o TypeScript)");
  run("pnpm", ["--filter", "@paperclipai/paperclip-runner", "run", "build:typescript"]);
  log("Compilando o servidor");
  // O `build` do servidor começa por `prepare:runner-vendor` (o build completo do runner, acima);
  // o resto é lido do próprio package.json para não ficar defasado.
  const serverBuild = readJson(join(root, "server", "package.json")).scripts.build.split(" && ").slice(1).join(" && ");
  // Sem o `pnpm run`, o `tsc` do servidor não está no PATH: acrescentamos a pasta dos binários.
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const serverBin = join(root, "server", "node_modules", ".bin");
  run("bash", ["-c", serverBuild], {
    cwd: join(root, "server"),
    shell: false,
    env: { [pathKey]: `${serverBin}${delimiter}${process.env[pathKey] ?? ""}` },
  });
  log("Copiando a interface (UI) para server/ui-dist");
  run("bash", ["scripts/prepare-server-ui-dist.sh"], { env: { ...process.env, PAPERCLIP_RELEASE_REUSE_UI_DIST: "1" } });
  log("Empacotando a CLI com o esbuild");
  run("pnpm", ["--filter", "paperclipai", "run", "build"]);
} else {
  log("Pulando a compilação (--skip-build)");
}

// ── 2. Descobre os pacotes do workspace ──────────────────────────────────────
function findPackageJsons(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "target", "dist-hive", "ui-dist"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findPackageJsons(full, found);
    else if (entry.name === "package.json") found.push(full);
  }
  return found;
}

/** nome → { dir, json } */
const workspace = new Map();
for (const file of findPackageJsons(root)) {
  const json = readJson(file);
  if (json.name) workspace.set(json.name, { dir: dirname(file), json });
}

const isInternal = (name) => workspace.has(name);

/** Fecho transitivo das dependências internas (só `dependencies`/`optionalDependencies`). */
function internalClosure(entryNames) {
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    const pkg = workspace.get(name);
    if (!pkg) throw new Error(`Pacote interno desconhecido: ${name}`);
    seen.add(name);
    for (const dep of Object.keys({ ...pkg.json.dependencies, ...pkg.json.optionalDependencies })) {
      if (isInternal(dep)) visit(dep);
    }
  };
  entryNames.forEach(visit);
  return [...seen];
}

const cli = workspace.get("paperclipai");
if (!cli) throw new Error("Não achei o pacote `paperclipai` (a CLI) no workspace.");
if (!existsSync(join(cli.dir, "dist", "index.js"))) {
  throw new Error("cli/dist/index.js não existe. Rode sem --skip-build.");
}

// O que o servidor precisa em tempo de execução (a CLI resolve `@paperclipai/server`
// dinamicamente) — mais o que o próprio bundle da CLI deixa como externo.
const internals = internalClosure(["@paperclipai/server"]).filter((name) => name !== "paperclipai");
log(`Pacotes internos que vão dentro do tarball: ${internals.length}`);
internals.forEach((name) => console.log(`   - ${name}`));

// ── 3. Empacota cada pacote interno com o pnpm e extrai na área de montagem ──
rmSync(outDir, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
const packTmp = mkdtempSync(join(tmpdir(), "hive-pack-"));

function extractTarball(tgz, destination) {
  mkdirSync(destination, { recursive: true });
  // `--strip-components=1` tira a pasta `package/` que o npm/pnpm põem no tarball.
  // O tar do Git Bash lê `C:\...` como "máquina:arquivo", então rodamos dentro da pasta de
  // destino e passamos o tarball por caminho relativo, que funciona em qualquer tar.
  const relative = pathRelative(destination, tgz).replaceAll("\\", "/");
  execFileSync("tar", ["-xzf", relative, "--strip-components=1"], { cwd: destination });
}

function packWorkspacePackage(name) {
  const pkg = workspace.get(name);
  const before = new Set(readdirSync(packTmp));
  // pnpm 9 não tem `--ignore-scripts` no `pack`; a variável de ambiente evita o `prepack` do
  // servidor, que recompilaria tudo (com as verificações que pulamos acima).
  run("pnpm", ["pack", "--pack-destination", packTmp], { cwd: pkg.dir, env: { npm_config_ignore_scripts: "true", npm_config_node_linker: "hoisted" } });
  const tgz = readdirSync(packTmp).find((file) => !before.has(file) && file.endsWith(".tgz"));
  if (!tgz) throw new Error(`pnpm pack não gerou o tarball de ${name}`);
  return join(packTmp, tgz);
}

for (const name of internals) {
  log(`Empacotando ${name}`);
  const tgz = packWorkspacePackage(name);
  const [scope, base] = name.split("/");
  extractTarball(tgz, join(stage, "vendor", scope, base));
}

// O binário nativo do runner (`paperclip-runnerd`) é do sistema em que o pacote foi montado e
// não serve nos outros: fora do tarball, que é o mesmo para Windows, macOS e Linux. O servidor
// sobe sem ele (só as sessões nativas "quentes" do Codex dependem dele).
for (const binDir of [
  join(stage, "vendor", "@paperclipai", "paperclip-runner", "dist", "bin"),
  join(stage, "vendor", "@paperclipai", "server", "dist", "vendor", "paperclip-runner", "bin"),
]) rmSync(binDir, { recursive: true, force: true });

log("Empacotando a CLI");
extractTarball(packWorkspacePackage("paperclipai"), stage);

// ── 4. Monta o package.json do `hive-agents` ─────────────────────────────────
const stagedCli = readJson(join(stage, "package.json"));

/** Dependências de terceiros de todos os pacotes (CLI + internos), sem as internas. */
const thirdParty = {};
const optional = {};
const conflicts = [];
function mergeDeps(target, source, owner) {
  for (const [name, range] of Object.entries(source ?? {})) {
    if (isInternal(name) || String(range).startsWith("workspace:")) continue;
    if (target[name] && target[name] !== range) conflicts.push(`${name}: "${target[name]}" vs "${range}" (${owner})`);
    target[name] ??= range;
  }
}
mergeDeps(thirdParty, stagedCli.dependencies, "paperclipai");
mergeDeps(optional, stagedCli.optionalDependencies, "paperclipai");
for (const name of internals) {
  const staged = readJson(join(stage, "vendor", ...name.split("/"), "package.json"));
  mergeDeps(thirdParty, staged.dependencies, name);
  mergeDeps(optional, staged.optionalDependencies, name);
}
// Um pacote opcional que também é dependência normal fica só como normal.
for (const name of Object.keys(optional)) if (thirdParty[name]) delete optional[name];

const hiveVersion = versionOverride ?? stagedCli.version;
const hivePkg = {
  name: "hive-agents",
  version: hiveVersion,
  description: "Hive — a equipe de IA da sua empresa, com direção, memória e controle. CLI e servidor.",
  type: "module",
  bin: { hive: "./bin/hive.mjs", "hive-agents": "./bin/hive.mjs" },
  keywords: ["hive", "ai", "agents", "orchestration", "cli", "knowledge-graph", "memory"],
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/gugow06/hive.git" },
  homepage: "https://github.com/gugow06/hive",
  bugs: { url: "https://github.com/gugow06/hive/issues" },
  files: ["bin", "lib", "dist", "vendor"],
  scripts: { postinstall: "node lib/link-vendor.mjs" },
  publishConfig: { access: "public" },
  engines: { node: ">=24.11.0" },
  dependencies: Object.fromEntries(Object.entries(thirdParty).sort(([a], [b]) => a.localeCompare(b))),
  optionalDependencies: Object.keys(optional).length
    ? Object.fromEntries(Object.entries(optional).sort(([a], [b]) => a.localeCompare(b)))
    : undefined,
};
// Os pacotes internos ficam em `vendor/` e são ligados em `node_modules/` depois da instalação
// (o `bundleDependencies` do npm falha em `npm i -g`). Os dois arquivos vêm de scripts/hive-package/.
mkdirSync(join(stage, "lib"), { recursive: true });
mkdirSync(join(stage, "bin"), { recursive: true });
cpSync(join(root, "scripts", "hive-package", "link-vendor.mjs"), join(stage, "lib", "link-vendor.mjs"));
cpSync(join(root, "scripts", "hive-package", "hive.mjs"), join(stage, "bin", "hive.mjs"));
writeFileSync(join(stage, "package.json"), JSON.stringify(hivePkg, null, 2) + "\n");

if (conflicts.length) {
  console.warn("\n[aviso] Dependências com faixas de versão diferentes entre pacotes (valeu a primeira):");
  conflicts.forEach((c) => console.warn(`   - ${c}`));
}

// ── 5. Nome que a pessoa vê: `hive`, não `paperclipai` ───────────────────────
// A CLI foi escrita com o nome do projeto original nas mensagens de ajuda. Aqui
// só os textos que a pessoa lê são trocados; escopos (`@paperclipai/…`) e nomes
// de variáveis de ambiente (`PAPERCLIP_*`) ficam como estão, porque o servidor
// depende deles.
const cliBundle = join(stage, "dist", "index.js");
let source = readFileSync(cliBundle, "utf8");
const replacements = [
  [/\.name\("paperclipai"\)/g, '.name("hive")'],
  [/npx paperclipai\b/g, "npx hive-agents"],
  [/pnpm paperclipai\b/g, "hive"],
  [/Paperclip CLI \\u2014 /g, "Hive CLI \\u2014 "],
  // `paperclipai <subcomando>` em mensagens e dicas
  [/(?<![@\w/.-])paperclipai(?= (?:onboard|run|doctor|configure|install|auth|allowed-hostname|env|db:backup|heartbeat|company|issue|agent|approval|activity|dashboard|context|worktree|routines|plugin|skills|connections|mcp)\b)/g, "hive"],
];
for (const [pattern, to] of replacements) source = source.replace(pattern, to);
writeFileSync(cliBundle, source);

// ── 6. Gera o tarball ────────────────────────────────────────────────────────
log("Gerando o tarball final com `npm pack`");
run("npm", ["pack", "--pack-destination", outDir], { cwd: stage });
rmSync(packTmp, { recursive: true, force: true });

const tarball = readdirSync(outDir).find((file) => file.endsWith(".tgz"));
console.log(`\nPronto: ${join(outDir, tarball)}`);
console.log("Teste local:  npm i -g ./dist-hive/" + tarball + "   &&   hive --help");
